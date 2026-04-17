const pool = require('../config/db');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        // The trigger stores seller_notifications.seller_id = sellers.id,
        // but req.user.id is users.id. We need to bridge that gap.
        const [rows] = await pool.query(
            `SELECT sn.id, sn.message, sn.is_read, sn.created_at
             FROM seller_notifications sn
             JOIN sellers s ON s.id = sn.seller_id
             WHERE s.user_id = ?
             ORDER BY sn.created_at DESC LIMIT 10`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error("Notifications Error:", err);
        res.status(500).json({ message: "Server error fetching notifications" });
    }
};