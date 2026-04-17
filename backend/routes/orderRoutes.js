const express = require('express');
const router = express.Router();
// CHANGE 1: Import from orderController, not cartController
const { placeOrder, getUserOrders, getOrderDetails } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// CHANGE 2: Map the routes to the correct order functions
router.post('/', placeOrder);        // Was addToCart
router.get('/', getUserOrders);      // Was getCart
router.get('/:id', getOrderDetails); // Was updateCartItem (or missing)

module.exports = router;