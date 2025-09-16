const { asyncHandler } = require('../utils/errors');

/**
 * GET /
 * Homepage
 */
exports.homepage = asyncHandler(async (req, res) => {
    // If user is already authenticated, redirect to dashboard
    if (req.user) {
        return res.redirect('/dashboard');
    }
    
    const locals = {
    title: "Notezy",
    description: "Free Notezy",
    };

    // Handle different message types
    let message = null;
    let messageType = 'info';
    
    if (req.query.message === 'logged-out') {
        message = 'You have been successfully logged out.';
        messageType = 'success';
    } else if (req.query.error === '1') {
        message = req.session.errorMessage || 'An error occurred. Please try again.';
        messageType = 'error';
    }

    res.render('index', {
        locals,
        message,
        messageType,
        successMessage: req.session.successMessage
    });

    // Clear messages after displaying
    delete req.session.errorMessage;
    delete req.session.successMessage;
});

/**
 * GET /features
 * Features page
 */
exports.features = asyncHandler(async (req, res) => {
    const locals = {
    title: "Features - Notezy",
    description: "Discover the powerful features of Notezy - Free Notezy",
        user: req.user
    };
    
    res.render('features', locals);
});

/**
 * GET /about
 * About page
 */
exports.about = asyncHandler(async (req, res) => {
    const locals = {
    title: "About Notezy",
    description: "Free Notezy",
        user: req.user
    };
    
    res.render('about', locals);
});

/**
 * GET /faq
 * FAQs page
 */
exports.faq = asyncHandler(async (req, res) => {
    const locals = {
    title: "FAQs Notezy",
    description: "Free Notezy",
        user: req.user
    };
    
    res.render('faq', locals);
});