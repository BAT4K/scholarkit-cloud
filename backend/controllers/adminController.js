const pool = require('../config/db');

// 1. Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [[revenueRows], [orderRows], [userRows], [lowStockRows]] = await Promise.all([
      pool.query('SELECT SUM(total_amount) as total FROM orders'),
      pool.query('SELECT COUNT(*) as count FROM orders'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student']),
      pool.query('SELECT COUNT(*) as count FROM products WHERE stock < 10')
    ]);

    res.json({
      totalRevenue: revenueRows[0].total || 0,
      totalOrders: orderRows[0].count,
      totalUsers: userRows[0].count,
      lowStockCount: lowStockRows[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error loading stats" });
  }
};

// 2. Get All Orders (for the Admin List)
exports.getAllOrders = async (req, res) => {
  try {
    const query = `
      SELECT o.id, o.total_amount, o.status, o.created_at,
             o.shipping_fee, o.tracking_number,
             u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching orders" });
  }
};

// 3. Update Order Status (Ship/Deliver) + optional tracking number
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, tracking_number } = req.body;

  try {
    // Build the update dynamically
    const fields = ['status = ?'];
    const params = [status];

    if (tracking_number !== undefined) {
      fields.push('tracking_number = ?');
      params.push(tracking_number);
    }

    params.push(id);

    const [updateResult] = await pool.query(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const [updatedOrder] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(updatedOrder[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating order" });
  }
};

// 4. Get Advanced Analytics (From our Window Function View!)
exports.getTopProducts = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vw_top_products_per_school');
    res.json(rows);
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: "Server error fetching top products" });
  }
};

// 5. Get Total Inventory Value (From our CURSOR-based Stored Procedure!)
exports.getInventoryValue = async (req, res) => {
  try {
    const [rows] = await pool.query('CALL CalculateTotalInventoryValue()');
    // MySQL stored procedure results come wrapped in an extra array
    const value = rows[0]?.[0]?.total_inventory_value ?? rows[0]?.total_inventory_value ?? 0;
    res.json({ totalInventoryValue: value });
  } catch (err) {
    console.error("Inventory Value Error:", err);
    res.status(500).json({ message: "Server error calculating inventory value" });
  }
};