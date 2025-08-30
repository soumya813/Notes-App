// Note service for business logic
const Note = require('../models/Notes');
const mongoose = require('mongoose');
const { validatePagination, isValidObjectId } = require('../utils/validation');
const { ValidationError, DatabaseError, NotFoundError } = require('../utils/errors');

/**
 * Get user notes with pagination and sorting
 * @param {string} userId - User ID
 * @param {number} perPage - Items per page
 * @param {number} page - Page number
 * @param {string} sortBy - Sort field (default: updatedAt)
 * @param {string} sortOrder - Sort order (asc/desc, default: desc)
 * @returns {Promise<Array>} Array of notes
 */
const getUserNotes = async (userId, perPage = 12, page = 1, sortBy = 'updatedAt', sortOrder = 'desc') => {
  try {
    if (!isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID');
    }

    const { page: validPage, perPage: validPerPage } = validatePagination(page, perPage);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const allowedSortFields = ['createdAt', 'updatedAt', 'title'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'updatedAt';

    const notes = await Note.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), isArchived: false } },
      { $sort: { [validSortBy]: sortDirection } },
      {
        $project: {
          title: { $substr: ["$title", 0, 30] },
          body: { $substr: ["$body", 0, 100] },
          createdAt: 1,
          updatedAt: 1,
          summary: 1,
          wordCount: {
            $size: {
              $split: [
                { $trim: { input: "$body" } },
                " "
              ]
            }
          }
        },
      },
      { $skip: (validPage - 1) * validPerPage },
      { $limit: validPerPage }
    ]);

    return notes;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve user notes');
  }
};

/**
 * Count total user notes
 * @param {string} userId - User ID
 * @param {boolean} includeArchived - Include archived notes in count
 * @returns {Promise<number>} Total count
 */
const countUserNotes = async (userId, includeArchived = false) => {
  try {
    if (!isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID');
    }

    const query = { user: userId };
    if (!includeArchived) {
      query.isArchived = false;
    }

    return await Note.countDocuments(query);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to count user notes');
  }
};

/**
 * Get a specific note by ID for a user
 * @param {string} noteId - Note ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Note object
 */
const getNoteById = async (noteId, userId) => {
  try {
    if (!isValidObjectId(noteId)) {
      throw new ValidationError('Invalid note ID');
    }

    if (!isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID');
    }

    const note = await Note.findOne({ 
      _id: noteId, 
      user: userId 
    }).lean();

    if (!note) {
      throw new NotFoundError('Note');
    }

    return note;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve note');
  }
};

/**
 * Create a new note
 * @param {Object} noteData - Note data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created note
 */
const createNote = async (noteData, userId) => {
  try {
    if (!isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID');
    }

    const note = await Note.create({
      ...noteData,
      user: userId
    });

    return note;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new ValidationError('Note validation failed', Object.values(error.errors).map(e => e.message));
    }
    throw new DatabaseError('Failed to create note');
  }
};

/**
 * Update a note
 * @param {string} noteId - Note ID
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated note
 */
const updateNote = async (noteId, userId, updateData) => {
  try {
    if (!isValidObjectId(noteId)) {
      throw new ValidationError('Invalid note ID');
    }

    if (!isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID');
    }

    // Filter allowed update fields
    const allowedFields = ['title', 'body', 'summary', 'tags', 'isArchived'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    const note = await Note.findOneAndUpdate(
      { _id: noteId, user: userId },
      filteredData,
      { new: true, runValidators: true }
    );

    if (!note) {
      throw new NotFoundError('Note');
    }

    return note;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new ValidationError('Note validation failed', Object.values(error.errors).map(e => e.message));
    }
    
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    
    throw new DatabaseError('Failed to update note');
  }
};

/**
 * Delete a note
 * @param {string} noteId - Note ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
const deleteNote = async (noteId, userId) => {
  try {
    if (!isValidObjectId(noteId)) {
      throw new ValidationError('Invalid note ID');
    }

    if (!isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID');
    }

    const result = await Note.deleteOne({ 
      _id: noteId, 
      user: userId 
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Note');
    }

    return true;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete note');
  }
};

/**
 * Search user notes
 * @param {string} userId - User ID
 * @param {string} searchTerm - Search term
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} Array of matching notes
 */
const searchUserNotes = async (userId, searchTerm, limit = 50) => {
  try {
    if (!isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID');
    }

    if (!searchTerm || typeof searchTerm !== 'string') {
      throw new ValidationError('Search term is required');
    }

    const notes = await Note.find({
      user: userId,
      isArchived: false,
      $or: [
        { title: { $regex: new RegExp(searchTerm, 'i') } },
        { body: { $regex: new RegExp(searchTerm, 'i') } }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(Math.min(limit, 100))
    .select('title body createdAt updatedAt')
    .lean();

    return notes;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to search notes');
  }
};

/**
 * Get user notes statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Statistics object
 */
const getUserNotesStats = async (userId) => {
  try {
    if (!isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID');
    }

    const stats = await Note.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          activeNotes: {
            $sum: { $cond: [{ $eq: ['$isArchived', false] }, 1, 0] }
          },
          archivedNotes: {
            $sum: { $cond: [{ $eq: ['$isArchived', true] }, 1, 0] }
          },
          totalWords: {
            $sum: {
              $size: {
                $split: [{ $trim: { input: '$body' } }, ' ']
              }
            }
          }
        }
      }
    ]);

    return stats[0] || {
      totalNotes: 0,
      activeNotes: 0,
      archivedNotes: 0,
      totalWords: 0
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to get notes statistics');
  }
};

module.exports = {
  getUserNotes,
  countUserNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  searchUserNotes,
  getUserNotesStats
};
