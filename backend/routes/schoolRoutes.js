const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 

router.get('/', async (req, res) => {
    try {
        const [columns] = await pool.query(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'schools'
               AND COLUMN_NAME = 'image_url'`
        );

        const imageColumn = columns.length > 0
            ? "COALESCE(image_url, 'https://placehold.co/640x360/e2e8f0/1e3a8a?text=School') AS image_url"
            : "'https://placehold.co/640x360/e2e8f0/1e3a8a?text=School' AS image_url";

        const query = `
            SELECT
                id,
                name,
                location,
                ${imageColumn}
            FROM schools
            ORDER BY id ASC
        `;
        
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
