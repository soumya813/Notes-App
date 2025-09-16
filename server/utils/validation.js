const mongoose = require('mongoose');

/**
 * Validation utilities for notezy
 */

/**
 * Check if string is valid and not empty
 * @param {string} str - String to validate
 * @param {number} minLength - Minimum length (default: 1)
 * @param {number} maxLength - Maximum length (default: 1000)
 * @returns {boolean} - Is valid
 */
const isValidString = (str, minLength = 1, maxLength = 1000) => {
    return typeof str === 'string' && 
           str.trim().length >= minLength && 
           str.trim().length <= maxLength;
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - Is valid ObjectId
 */
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Sanitize search term (remove special characters)
 * @param {string} term - Search term to sanitize
 * @returns {string} - Sanitized term
 */
const sanitizeSearchTerm = (term) => {
    if (typeof term !== 'string') return '';
    return term.replace(/[^a-zA-Z0-9\s]/g, '').trim();
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email);
};

/**
 * Validate note data
 * @param {Object} noteData - Note data to validate
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
const validateNoteData = (noteData) => {
    const errors = [];
    
    if (!noteData.title || !isValidString(noteData.title, 1, 200)) {
        errors.push('Title is required and must be between 1-200 characters');
    }
    
    if (!noteData.body || !isValidString(noteData.body, 1, 50000)) {
        errors.push('Note content is required and must be between 1-50000 characters');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate pagination parameters
 * @param {string|number} page - Page number
 * @param {string|number} perPage - Items per page
 * @returns {Object} - Validated pagination params
 */
const validatePagination = (page = 1, perPage = 12) => {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validPerPage = Math.min(50, Math.max(1, parseInt(perPage) || 12));
    
    return {
        page: validPage,
        perPage: validPerPage
    };
};

/**
 * Validate user profile data from Google OAuth
 * @param {Object} profile - Google profile data
 * @returns {Object} - Validation result
 */
const validateGoogleProfile = (profile) => {
    const errors = [];
    
    if (!profile.id) {
        errors.push('Google ID is required');
    }
    
    if (!profile.displayName) {
        errors.push('Display name is required');
    }
    
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    if (!email || !isValidEmail(email)) {
        errors.push('Valid email is required from Google account');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        email
    };
};

module.exports = {
    isValidString,
    isValidObjectId,
    sanitizeSearchTerm,
    isValidEmail,
    validateNoteData,
    validatePagination,
    validateGoogleProfile
};
