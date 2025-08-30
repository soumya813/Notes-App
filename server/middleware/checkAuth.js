const { AuthenticationError } = require('../utils/errors');

/**
 * Middleware to check if user is authenticated
 */
exports.isLoggedIn = function(req, res, next) {
    if (req.user) {
        return next();
    }
    
    // Handle API requests
    if (req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
        return next(new AuthenticationError('Authentication required to access this resource'));
    }
    
    // Handle web requests
    req.session.returnTo = req.originalUrl;
    return res.redirect('/');
};

/**
 * Middleware to check if user is NOT authenticated (for login/register pages)
 */
exports.isLoggedOut = function(req, res, next) {
    if (!req.user) {
        return next();
    }
    
    // If user is already logged in, redirect to dashboard
    return res.redirect('/dashboard');
};

/**
 * Optional authentication - continues regardless of auth status
 */
exports.optionalAuth = function(req, res, next) {
    // Always continue, auth is optional
    next();
};