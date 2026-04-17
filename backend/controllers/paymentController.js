const Razorpay = require('razorpay');
const pool = require('../config/db');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createPaymentOrder = async (req, res) => {
    try {
        const userId = req.user.id;

        // FIXED: Changed PostgreSQL $1 to MySQL ? and used array destructuring [cartItems]
        const query = `
            SELECT c.quantity, p.price 
            FROM cart_items c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `;
        
        const [cartItems] = await pool.query(query, [userId]);

        if (cartItems.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // Calculate the total amount for Razorpay
        const totalAmount = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

        // Razorpay expects the amount in the smallest currency unit (paise)
        const options = {
            amount: Math.round(totalAmount * 100), 
            currency: "INR",
            receipt: `receipt_order_${userId}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json(order);

    } catch (err) {
        console.error("Payment Order Error:", err);
        res.status(500).json({ message: "Something went wrong creating payment order" });
    }
};