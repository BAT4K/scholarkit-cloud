const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // 1. Get token from header
    const tokenHeader = req.header('Authorization');

    // 2. Check if no token
    if (!tokenHeader) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        const token = tokenHeader.split(" ")[1];
        
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Attach user to request object
        req.user = decoded;
        next();

    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};