const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../../../middleware/checkAuth');
const { validateObjectId, validateNote, validatePagination, validateSearch } = require('../../../middleware/validation');
const dashboardController = require('../../../controllers/dashboardController');
const noteService = require('../../../services/noteService');

// RESTful API endpoints for notes with validation
router.get('/', isLoggedIn, validatePagination, dashboardController.dashboard); // List notes
router.get('/:id', isLoggedIn, validateObjectId(), dashboardController.dashboardViewNote); // Get note by ID
router.post('/', isLoggedIn, validateNote, dashboardController.dashboardAddNotePost); // Create note
router.put('/:id', isLoggedIn, validateObjectId(), validateNote, dashboardController.dashboardUpdateNote); // Update note
router.delete('/:id', isLoggedIn, validateObjectId(), dashboardController.dashboardDeleteNote); // Delete note

// Search endpoint for live search
router.get('/search/:searchTerm', isLoggedIn, async (req, res) => {
  try {
    const searchTerm = req.params.searchTerm;
    
    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.json({ success: true, notes: [] });
    }

    if (searchTerm.trim().length < 1 || searchTerm.trim().length > 100) {
      return res.status(400).json({ success: false, error: 'Search term must be between 1-100 characters' });
    }

    const searchResults = await noteService.searchUserNotes(req.user.id, searchTerm.trim(), 10);
    
    res.json({ 
      success: true, 
      notes: searchResults,
      searchTerm: searchTerm.trim()
    });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
