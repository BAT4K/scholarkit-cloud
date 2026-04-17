// RBAC Middleware: isAdmin — Only allows admin role
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Admins only.' });
};

// RBAC Middleware: isSeller — Allows seller OR admin
exports.isSeller = (req, res, next) => {
    if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Sellers and admins only.' });
};
