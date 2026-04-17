const express = require('express');
const cloudinary = require('../utils/cloudinary');
const upload = require('../utils/multer');
const authMiddleware = require('../middleware/authMiddleware');
const { isSeller } = require('../middleware/rbacMiddleware');

const router = express.Router();

// POST /api/upload — Upload a single image to Cloudinary
router.post('/', authMiddleware, isSeller, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided.' });
        }

        // Upload buffer to Cloudinary via stream
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'scholarkit/products',
                    resource_type: 'image',
                    transformation: [
                        { width: 800, height: 800, crop: 'limit', quality: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        res.json({
            image_url: result.secure_url,
            public_id: result.public_id
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ message: err.message || 'Image upload failed.' });
    }
});

module.exports = router;
