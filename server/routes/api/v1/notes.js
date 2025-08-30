const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../../../middleware/checkAuth');
const { validateObjectId, validateNote, validatePagination } = require('../../../middleware/validation');
const dashboardController = require('../../../controllers/dashboardController');

// RESTful API endpoints for notes with validation
router.get('/', isLoggedIn, validatePagination, dashboardController.dashboard); // List notes
router.get('/:id', isLoggedIn, validateObjectId(), dashboardController.dashboardViewNote); // Get note by ID
router.post('/', isLoggedIn, validateNote, dashboardController.dashboardAddNotePost); // Create note
router.put('/:id', isLoggedIn, validateObjectId(), validateNote, dashboardController.dashboardUpdateNote); // Update note
router.delete('/:id', isLoggedIn, validateObjectId(), dashboardController.dashboardDeleteNote); // Delete note

module.exports = router;
