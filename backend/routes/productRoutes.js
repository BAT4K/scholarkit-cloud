const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { isSeller } = require('../middleware/rbacMiddleware');
const {
    getSellerProducts,
    updateProductStock,
    getProductPriceHistory,
    createProduct,
    updateProduct,
    deleteProduct,
    getSchools,
    getImageGallery
} = require('../controllers/productController');

const router = express.Router();

// Public
router.get('/:id/price-history', getProductPriceHistory);

// Auth-protected
router.use(authMiddleware);
router.get('/schools', getSchools);
router.get('/images/gallery', isSeller, getImageGallery);
router.get('/seller', getSellerProducts);

// Seller + Admin CRUD
router.post('/', isSeller, createProduct);
router.put('/:id', isSeller, updateProduct);
router.put('/:id/stock', isSeller, updateProductStock);
router.delete('/:id', isSeller, deleteProduct);

module.exports = router;
