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
        title: "NotesApp",
        description: "Free Notes App",
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
    // If user is already authenticated, redirect to dashboard
    if (req.user) {
        return res.redirect('/dashboard');
    }
    
    const locals = {
        title: "Features - NotesApp",
        description: "Discover the powerful features of NotesApp - Free Notes App",
    };
    
    res.render('features', locals);
});

/**
 * GET /about
 * About page
 */
exports.about = asyncHandler(async (req, res) => {
    // If user is already authenticated, redirect to dashboard
    if (req.user) {
        return res.redirect('/dashboard');
    }
    
    const locals = {
        title: "About NotesApp",
        description: "Free Notes App",
    };
    
    res.render('about', locals);
});

/**
 * GET /faq
 * FAQs page
 */
exports.faq = asyncHandler(async (req, res) => {
    // If user is already authenticated, redirect to dashboard
    if (req.user) {
        return res.redirect('/dashboard');
    }
    
    const locals = {
        title: "FAQs NotesApp",
        description: "Free Notes App",
    };
    
    res.render('faq', locals);
});