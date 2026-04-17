const express = require('express');
const router = express.Router();
const { createPaymentOrder } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create-order', authMiddleware, createPaymentOrder);

module.exports = router;