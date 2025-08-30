/**
 * Session cleanup middleware to prevent infinite redirect loops
 */

/**
 * Middleware to detect and handle session-related infinite loops
 */
const preventInfiniteRedirects = (req, res, next) => {
    // Check if we're getting repeated error redirects
    if (req.query.error === '1') {
        const redirectCount = req.session.redirectCount || 0;
        
        if (redirectCount > 3) {
            // Clear the session to break the loop
            console.warn('Infinite redirect detected, clearing session');
            
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
                res.clearCookie('notes.sid');
                return res.redirect('/');
            });
            return;
        }
        
        req.session.redirectCount = redirectCount + 1;
    } else {
        // Reset counter for non-error requests
        if (req.session) {
            delete req.session.redirectCount;
        }
    }
    
    next();
};

/**
 * Middleware to clean up user session if user no longer exists
 */
const validateUserSession = (req, res, next) => {
    // If there's a user in session but no user object, clear the session
    if (req.session && req.session.passport && req.session.passport.user && !req.user) {
        console.log('User in session but not found in database, clearing session');
        req.logout((err) => {
            if (err) {
                console.error('Error during logout:', err);
            }
            req.session.destroy((destroyErr) => {
                if (destroyErr) {
                    console.error('Error destroying session:', destroyErr);
                }
                res.clearCookie('notes.sid');
                return res.redirect('/');
            });
        });
        return;
    }
    
    next();
};

module.exports = {
    preventInfiniteRedirects,
    validateUserSession
};
