const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { isLoggedIn } = require('../middleware/checkAuth');
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, req.user.id + '-' + Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.get('/', isLoggedIn, profileController.getProfile);
router.post('/update', isLoggedIn, upload.single('profilePicture'), profileController.updateProfile);
router.post('/delete', isLoggedIn, profileController.deleteProfile);

module.exports = router; 