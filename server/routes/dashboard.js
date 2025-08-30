const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const { validateObjectId, validateNote, validateSearch, validateSummarizeRequest, validatePagination, rateLimitSensitiveOps } = require('../middleware/validation');
const dashboardController = require('../controllers/dashboardController');

/**
 * dashboard routes with validation middleware
 */
router.get('/dashboard', isLoggedIn, validatePagination, dashboardController.dashboard);

router.get('/dashboard/item/:id', isLoggedIn, validateObjectId(), dashboardController.dashboardViewNote);

router.put('/dashboard/item/:id', isLoggedIn, validateObjectId(), validateNote, dashboardController.dashboardUpdateNote);

router.delete('/dashboard/item-delete/:id', isLoggedIn, validateObjectId(), dashboardController.dashboardDeleteNote);

router.post('/dashboard/summarize', isLoggedIn, validateSummarizeRequest, rateLimitSensitiveOps(5, 15 * 60 * 1000), dashboardController.dashboardSummarizeNote);

router.get('/dashboard/add', isLoggedIn, dashboardController.dashboardAddNote);

router.post('/dashboard/add', isLoggedIn, validateNote, dashboardController.dashboardAddNotePost);

router.get('/dashboard/search', isLoggedIn, dashboardController.dashboardSearch);

router.post('/dashboard/search', isLoggedIn, validateSearch, dashboardController.dashboardSearchSubmit);

// EXPORT FEATURE: Route to export all notes for the current user
router.get('/dashboard/export', isLoggedIn, dashboardController.dashboardExport);

// EXPORT FEATURE: Route to export individual note by ID
router.get('/dashboard/export/:id', isLoggedIn, validateObjectId(), dashboardController.dashboardExportNote);

module.exports = router;