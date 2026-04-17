const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Cloudinary auto-configures from CLOUDINARY_URL env variable.
// If individual vars are provided instead, configure manually:
if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

module.exports = cloudinary;
