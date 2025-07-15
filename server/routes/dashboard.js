const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const dashboardController = require('../controllers/dashboardController');

/**
 * dashboard routes
 */
router.get('/dashboard',isLoggedIn, dashboardController.dashboard);
router.get('/dashboard/item/:id',isLoggedIn, dashboardController.dashboardViewNote);
router.put('/dashboard/item/:id',isLoggedIn, dashboardController.dashboardUpdateNote);
router.delete('/dashboard/item-delete/:id',isLoggedIn, dashboardController.dashboardDeleteNote);
router.post('/dashboard/summarize', dashboardController.dashboardSummarizeNote);
router.get('/dashboard/add',isLoggedIn, dashboardController.dashboardAddNote);
router.post('/dashboard/add',isLoggedIn, dashboardController.dashboardAddNote);
router.get('/dashboard/search',isLoggedIn, dashboardController.dashboardSearch);
router.post('/dashboard/search',isLoggedIn, dashboardController.dashboardSearchSubmit);


// Archived notes page
router.get('/dashboard/archived', isLoggedIn, dashboardController.dashboardArchivedNotes);

// Archive a note
router.patch('/notes/:id/archive', dashboardController.archiveNote);
// Restore a note
router.patch('/notes/:id/restore', dashboardController.restoreNote);
// Permanently delete a note
router.delete('/notes/:id/permanent', dashboardController.deleteNotePermanently);

// No authentication middleware here
router.post('/autosave', (req, res) => {
    // Just log or mock-save the note
    console.log('Auto-saving note:', req.body.content);
    res.json({ success: true });
});

router.post('/archived', (req, res) => {
    // Just log or mock-archive the note
    console.log('Archiving note:', req.body.content);
    res.json({ success: true });
});

=======
// EXPORT FEATURE: Route to export all notes for the current user
router.get('/dashboard/export',isLoggedIn, dashboardController.dashboardExport);

// EXPORT FEATURE: Route to export individual note by ID
router.get('/dashboard/export/:id',isLoggedIn, dashboardController.dashboardExportNote);


module.exports = router;