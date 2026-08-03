const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authMiddleware } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const uploadStream = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'campus_connect_uploads' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });

    const imageUrl = await uploadStream;
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

module.exports = router;
