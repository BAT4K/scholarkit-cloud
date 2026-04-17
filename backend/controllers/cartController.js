const pool = require('../config/db');
const { columnExists } = require('../utils/schema');

const PRODUCT_PLACEHOLDER = 'https://placehold.co/600x400/e2e8f0/1e3a8a?text=ScholarKit';

// 1. Get Cart
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id; 
        const hasProductImage = await columnExists('products', 'image_url');
        const imageSelect = hasProductImage
            ? 'COALESCE(p.image_url, ?) AS image_url'
            : '? AS image_url';

        const query = `
            SELECT 
                c.id,
                c.quantity, 
                c.size, 
                p.id as product_id, 
                p.name, 
                p.price,
                p.discount_percent,
                ${imageSelect}
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `;
        
        const [rows] = await pool.query(query, [PRODUCT_PLACEHOLDER, userId]);
        res.json(rows);
    } catch (err) {
        console.error("Cart Fetch Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// 2. Add to Cart
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, quantity, size } = req.body;
        const itemSize = size || 'Standard';
        const itemQuantity = quantity || 1;

        // Check if this exact item/size is already in the cart
        const checkQuery = 'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?';
        const [existingItems] = await pool.query(checkQuery, [userId, product_id, itemSize]);

        if (existingItems.length > 0) {
            // If it exists, just update the quantity (No RETURNING needed in MySQL)
            const updateQuery = 'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?';
            await pool.query(updateQuery, [itemQuantity, existingItems[0].id]);
        } else {
            // If it's new, insert it
            const insertQuery = 'INSERT INTO cart_items (user_id, product_id, quantity, size) VALUES (?, ?, ?, ?)';
            await pool.query(insertQuery, [userId, product_id, itemQuantity, itemSize]);
        }

        res.status(200).json({ message: "Item added to cart successfully" });
    } catch (err) {
        console.error("Add to Cart Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// 3. Remove from Cart
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const itemId = req.params.id; // The ID of the cart_items row

        const deleteQuery = 'DELETE FROM cart_items WHERE id = ? AND user_id = ?';
        await pool.query(deleteQuery, [itemId, userId]);

        res.status(200).json({ message: "Item removed from cart" });
    } catch (err) {
        console.error("Remove from Cart Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// 4. Update Cart Quantity (The missing function!)
exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const itemId = req.params.id; // The ID of the cart item
        const { quantity } = req.body;

        // MySQL syntax for updating
        const updateQuery = 'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?';
        await pool.query(updateQuery, [quantity, itemId, userId]);

        res.status(200).json({ message: "Cart quantity updated successfully" });
    } catch (err) {
        console.error("Update Cart Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
