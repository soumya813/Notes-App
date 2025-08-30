const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/checkAuth');
const mainController = require('../controllers/mainController');

/**
 * Public app routes with optional authentication
 */
router.get('/', optionalAuth, mainController.homepage);
router.get('/features', optionalAuth, mainController.features);
router.get('/about', optionalAuth, mainController.about);
router.get('/faq', optionalAuth, mainController.faq);

module.exports = router;