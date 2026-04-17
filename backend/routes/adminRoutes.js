const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllOrders, updateOrderStatus, getInventoryValue } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware, adminMiddleware);

router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.get('/inventory-value', getInventoryValue);
router.put('/orders/:id', updateOrderStatus);

module.exports = router;