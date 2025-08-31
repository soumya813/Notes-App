const noteService = require('../services/noteService');
const Note = require('../models/Notes');
const { asyncHandler } = require('../utils/errors');
const { ValidationError, NotFoundError, ExternalAPIError } = require('../utils/errors');
const axios = require('axios');

/**
 * GET /dashboard
 * Dashboard homepage with user notes
 */
exports.dashboard = asyncHandler(async (req, res) => {
  const { page: validPage, perPage: validPerPage } = require('../utils/validation').validatePagination(req.query.page, req.query.perPage);

  const locals = {
    title: "Dashboard",
    description: "Free NodeJS Notes App.",
  };

  const notes = await noteService.getUserNotes(req.user.id, validPerPage, validPage);
  const count = await noteService.countUserNotes(req.user.id);
  const stats = await noteService.getUserNotesStats(req.user.id);

  res.render('dashboard/index', {
    userName: req.user.firstName,
    locals,
    notes,
    stats,
    layout: "../views/layouts/dashboard",
    current: validPage,
    pages: Math.ceil(count / validPerPage),
    errorMessage: req.session.errorMessage,
    successMessage: req.session.successMessage
  });

  // Clear messages after displaying
  delete req.session.errorMessage;
  delete req.session.successMessage;
});

/**
 * GET /dashboard/item/:id
 * View specific note
 */
exports.dashboardViewNote = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteById(req.params.id, req.user.id);
  const isOwner = String(note.user) === String(req.user.id);
  let collaboratorList = [];
  if (isOwner) {
    // Populate collaborator details for owner view
    const full = await Note.findOne({ _id: req.params.id, user: req.user.id })
      .populate('collaborators', 'firstName lastName email')
      .select('collaborators isCollabEnabled')
      .lean();
    if (full && full.collaborators) {
      collaboratorList = full.collaborators.map(c => ({
        id: String(c._id),
        name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email,
        email: c.email
      }));
      note.isCollabEnabled = !!full.isCollabEnabled;
      note.collaborators = full.collaborators.map(c => String(c._id));
    }
  }

  res.render('dashboard/view-notes', {
    noteID: req.params.id,
  note,
    isOwner,
    collaboratorList,
    layout: '../views/layouts/dashboard',
    successMessage: req.session.successMessage,
    errorMessage: req.session.errorMessage
  });

  // Clear messages after displaying
  delete req.session.errorMessage;
  delete req.session.successMessage;
});

/**
 * PUT /dashboard/item/:id
 * Update specific note
 */
exports.dashboardUpdateNote = asyncHandler(async (req, res) => {
  await noteService.updateNote(req.params.id, req.user.id, {
    title: req.body.title,
    body: req.body.body
  });

  req.session.successMessage = 'Note updated successfully!';
  res.redirect('/dashboard');
});

/**
 * DELETE /dashboard/item-delete/:id
 * Delete note
 */
exports.dashboardDeleteNote = asyncHandler(async (req, res) => {
  await noteService.deleteNote(req.params.id, req.user.id);

  req.session.successMessage = 'Note deleted successfully!';
  res.redirect('/dashboard');
});

/**
 * GET /dashboard/add
 * Show add note form
 */
exports.dashboardAddNote = asyncHandler(async (req, res) => {
  res.render('dashboard/add', {
    layout: '../views/layouts/dashboard',
    errorMessage: req.session.errorMessage,
    formData: req.session.formData || {}
  });

  // Clear form data after displaying
  delete req.session.errorMessage;
  delete req.session.formData;
});

/**
 * POST /dashboard/add
 * Create new note
 */
exports.dashboardAddNotePost = asyncHandler(async (req, res) => {
  await noteService.createNote({
    title: req.body.title,
    body: req.body.body
  }, req.user.id);

  req.session.successMessage = 'Note created successfully!';
  res.redirect('/dashboard');
});

/**
 * GET /dashboard/search
 * Show search form
 */
exports.dashboardSearch = asyncHandler(async (req, res) => {
  res.render('dashboard/search', {
    searchResults: '',
    layout: '../views/layouts/dashboard'
  });
});

/**
 * POST /dashboard/search
 * Search for notes
 */
exports.dashboardSearchSubmit = asyncHandler(async (req, res) => {
  const searchTerm = req.body.searchTerm;
  
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
    return res.render('dashboard/search', {
      searchResults: [],
      searchTerm: '',
      layout: '../views/layouts/dashboard',
      error: 'Please enter a search term'
    });
  }

  const searchResults = await noteService.searchUserNotes(req.user.id, searchTerm.trim());

  res.render('dashboard/search', {
    searchResults,
    searchTerm,
    layout: '../views/layouts/dashboard'
  });
});

/**
 * GET /dashboard/export
 * Export all notes
 */
exports.dashboardExport = asyncHandler(async (req, res) => {
  // Get all notes for export (no pagination)
  const notes = await Note.find({ user: req.user.id, isArchived: false })
    .sort({ updatedAt: -1 })
    .lean();

  res.render('dashboard/export', {
    userName: req.user.firstName,
    notes,
    layout: '../views/layouts/dashboard'
  });
});

/**
 * GET /dashboard/export/:id
 * Export individual note
 */
exports.dashboardExportNote = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteById(req.params.id, req.user.id);

  res.render('dashboard/export-note', {
    userName: req.user.firstName,
    note,
    layout: '../views/layouts/dashboard'
  });
});

/**
 * POST /dashboard/summarize
 * Summarize note using external API
 */
exports.dashboardSummarizeNote = asyncHandler(async (req, res) => {
  const { text, noteId } = req.body;

  // Validate input
  if (!text || typeof text !== 'string' || text.trim().length < 50) {
    throw new ValidationError('Text content is required and must be at least 50 characters long');
  }

  if (text.length > 50000) {
    throw new ValidationError('Text is too long for summarization (max 50,000 characters)');
  }

  if (!process.env.HUGGING_FACE_API) {
    throw new ExternalAPIError('Hugging Face', 'API key not configured');
  }

  try {
    // Call Hugging Face API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      { inputs: text.trim() },
      {
        headers: { 
          Authorization: `Bearer ${process.env.HUGGING_FACE_API}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      throw new ExternalAPIError('Hugging Face', 'Invalid response format');
    }

    const summary = response.data[0]?.summary_text || "No summary generated.";

    // Save summary to the note if noteId is provided
    if (noteId) {
      await noteService.updateNote(noteId, req.user.id, { summary });
    }

    res.json({ 
      success: true,
      summary,
      message: noteId ? 'Summary generated and saved to note' : 'Summary generated'
    });

  } catch (error) {
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const message = error.response.data?.error || 'External API error';
      
      if (status === 503) {
        throw new ExternalAPIError('Hugging Face', 'Model is loading, please try again in a few moments');
      } else if (status === 429) {
        throw new ExternalAPIError('Hugging Face', 'Rate limit exceeded, please try again later');
      } else if (status === 400) {
        throw new ValidationError('Invalid input for summarization');
      } else {
        throw new ExternalAPIError('Hugging Face', message);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new ExternalAPIError('Hugging Face', 'Request timeout - please try again');
    } else if (error instanceof ValidationError || error instanceof ExternalAPIError) {
      throw error;
    } else {
      throw new ExternalAPIError('Hugging Face', 'Failed to generate summary');
    }
  }
});

module.exports = exports;
