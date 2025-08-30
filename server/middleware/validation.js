const { ValidationError } = require('../utils/errors');
const { isValidObjectId, validateNoteData, sanitizeSearchTerm, validatePagination } = require('../utils/validation');

/**
 * Validate MongoDB ObjectId parameter
 */
exports.validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!id || !isValidObjectId(id)) {
            return next(new ValidationError(`Invalid ${paramName} format`));
        }
        
        next();
    };
};

/**
 * Validate note data for create/update operations
 */
exports.validateNote = (req, res, next) => {
    const validation = validateNoteData(req.body);
    
    if (!validation.isValid) {
        return next(new ValidationError('Note validation failed', validation.errors));
    }
    
    // Sanitize the input
    req.body.title = req.body.title.trim();
    req.body.body = req.body.body.trim();
    
    next();
};

/**
 * Validate and sanitize search parameters
 */
exports.validateSearch = (req, res, next) => {
    const { searchTerm } = req.body;
    
    if (!searchTerm || typeof searchTerm !== 'string') {
        return next(new ValidationError('Search term is required'));
    }
    
    const sanitized = sanitizeSearchTerm(searchTerm);
    
    if (sanitized.length < 1) {
        return next(new ValidationError('Search term must contain at least one alphanumeric character'));
    }
    
    if (sanitized.length > 100) {
        return next(new ValidationError('Search term is too long (max 100 characters)'));
    }
    
    req.body.searchTerm = sanitized;
    next();
};

/**
 * Validate pagination parameters
 */
exports.validatePagination = (req, res, next) => {
    const { page, perPage } = validatePagination(req.query.page, req.query.perPage);
    
    req.query.page = page;
    req.query.perPage = perPage;
    
    next();
};

/**
 * Validate summarization request
 */
exports.validateSummarizeRequest = (req, res, next) => {
    const { text, noteId } = req.body;
    
    if (!text || typeof text !== 'string') {
        return next(new ValidationError('Text content is required for summarization'));
    }
    
    if (text.trim().length < 50) {
        return next(new ValidationError('Text must be at least 50 characters long for meaningful summarization'));
    }
    
    if (text.trim().length > 50000) {
        return next(new ValidationError('Text is too long for summarization (max 50,000 characters)'));
    }
    
    if (noteId && !isValidObjectId(noteId)) {
        return next(new ValidationError('Invalid note ID format'));
    }
    
    req.body.text = text.trim();
    next();
};

/**
 * Rate limiting middleware for sensitive operations
 */
exports.rateLimitSensitiveOps = (maxRequests = 10, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const key = req.ip + (req.user?.id || '');
        const now = Date.now();
        
        if (!requests.has(key)) {
            requests.set(key, []);
        }
        
        const userRequests = requests.get(key);
        const recentRequests = userRequests.filter(time => now - time < windowMs);
        
        if (recentRequests.length >= maxRequests) {
            return next(new ValidationError(`Too many requests. Please try again later.`, [], 429));
        }
        
        recentRequests.push(now);
        requests.set(key, recentRequests);
        
        next();
    };
};

module.exports = exports;
