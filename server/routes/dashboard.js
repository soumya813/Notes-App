const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const dashboardController = require('../controllers/dashboardController');
const imageUploadController = require('../controllers/imageUploadController');
const multer = require('multer');
const upload = multer();

/**
 * dashboard routes
 */
router.get('/dashboard',isLoggedIn, dashboardController.dashboard);
router.get('/dashboard/item/:id',isLoggedIn, dashboardController.dashboardViewNote);
router.put('/dashboard/item/:id',isLoggedIn, dashboardController.dashboardUpdateNote);
router.delete('/dashboard/item-delete/:id',isLoggedIn, dashboardController.dashboardDeleteNote);
router.post('/dashboard/summarize', dashboardController.dashboardSummarizeNote);
router.get('/dashboard/add',isLoggedIn, dashboardController.dashboardAddNote);
router.post('/dashboard/add',isLoggedIn, upload.none(), dashboardController.dashboardAddNote);
router.get('/dashboard/search',isLoggedIn, dashboardController.dashboardSearch);
router.post('/dashboard/search',isLoggedIn, dashboardController.dashboardSearchSubmit);

// Image upload route
router.post('/dashboard/upload-image', isLoggedIn, imageUploadController.uploadImage, imageUploadController.handleUpload);

module.exports = router;