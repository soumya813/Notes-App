const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../../../middleware/checkAuth');
const dashboardController = require('../../../controllers/dashboardController');

// RESTful API endpoints for notes
router.get('/', isLoggedIn, dashboardController.dashboard); // List notes
router.get('/:id', isLoggedIn, dashboardController.dashboardViewNote); // Get note by ID
router.post('/', isLoggedIn, dashboardController.dashboardAddNote); // Create note
router.put('/:id', isLoggedIn, dashboardController.dashboardUpdateNote); // Update note
router.delete('/:id', isLoggedIn, dashboardController.dashboardDeleteNote); // Delete note

module.exports = router;
