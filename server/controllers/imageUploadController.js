const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'notesapp',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
  },
});

const upload = multer({ storage: storage });

// Middleware to use in routes
exports.uploadImage = upload.array('images', 5); // up to 5 images per note

// Route handler
exports.handleUpload = (req, res) => {
  try {
    const imageUrls = req.files.map(file => file.path);
    res.json({ imageUrls });
  } catch (err) {
    res.status(500).json({ error: 'Image upload failed' });
  }
}; 