const pool = require('../config/db');
const { columnExists } = require('../utils/schema');

const PRODUCT_PLACEHOLDER = 'https://placehold.co/600x400/e2e8f0/1e3a8a?text=ScholarKit';

// 1. Place Order (Directly triggers the MySQL Stored Procedure)
exports.placeOrder = async (req, res) => {
  const userId = req.user.id;

  try {
    // FIXED: Calling the Stored Procedure with EXACTLY 1 argument (userId)
    await pool.query('CALL PlaceOrder(?)', [userId]);
    
    // Fetch the newly created order ID to pass to the Success Page
    const [orderResult] = await pool.query(
      'SELECT id FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', 
      [userId]
    );
    
    const orderId = orderResult.length > 0 ? orderResult[0].id : null;

    res.status(201).json({ message: "Order placed successfully via Stored Procedure!", orderId });

  } catch (err) {
    console.error("Checkout Error:", err.message);
    
    if (err.sqlState === '45000') {
        return res.status(400).json({ message: "Cannot checkout: Your cart is empty." });
    }
    
    res.status(500).json({ message: "Transaction failed and was rolled back by the database." });
  }
};

// 2. Get User's Order History (Advanced MySQL JSON Aggregation)
exports.getUserOrders = async (req, res) => {
  try {
    const hasProductImage = await columnExists('products', 'image_url');
    const imageExpression = hasProductImage
      ? 'COALESCE(p.image_url, ?)'
      : '?';

    const query = `
      SELECT 
        o.id, 
        o.total_amount, 
        o.status, 
        o.created_at,
        o.shipping_fee,
        o.tracking_number,
        COALESCE(
          JSON_ARRAYAGG(
              JSON_OBJECT(
              'name', p.name,
              'image_url', ${imageExpression},
              'quantity', oi.quantity,
              'price', oi.price_at_purchase
            )
          ), 
          JSON_ARRAY()
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const [rows] = await pool.query(query, [PRODUCT_PLACEHOLDER, req.user.id]);
    
    const parsedRows = rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
    }));

    res.json(parsedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Get Single Order Details
exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT oi.id, oi.quantity, oi.price_at_purchase, p.name, p.category 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
