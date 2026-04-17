const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Standard Routes
const shopRoutes = require('./routes/shopRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// 🚀 NEW: Import Controllers for Advanced Features
const { getTopProducts } = require('./controllers/adminController');
const { getNotifications } = require('./controllers/notificationController');
const { getRecommendations } = require('./controllers/productController');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://scholarkit-web.vercel.app',
    'https://scholarkit-api.vercel.app'
];

// Middleware (Manual CORS)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    // Explicitly set these headers for preflight and normal requests
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

app.use(express.json());

// Standard Base Routes
app.use('/api', shopRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);

// 🚀 NEW: Routes for Advanced Features (Analytics & Notifications)
app.get('/api/analytics/top-products', getTopProducts);
app.get('/api/notifications', authMiddleware, getNotifications);
app.get('/api/recommendations', authMiddleware, getRecommendations);

app.get("/", (req, res) => {
    res.send("ScholarKit Backend is Running");
});

const PORT = process.env.PORT || 3000;
let server;

function startServer() {
    if (server) {
        return server;
    }

    server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
        console.error('HTTP server error:', error);
    });

    server.on('close', () => {
        console.error('HTTP server closed unexpectedly.');
    });

    return server;
}

if (require.main === module) {
    startServer();
}

module.exports = app;
