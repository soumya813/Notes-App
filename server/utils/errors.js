/**
 * Custom Error Classes and Error Handling Utilities
 */

class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400);
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403);
        this.name = 'AuthorizationError';
    }
}

class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500);
        this.name = 'DatabaseError';
    }
}

class ExternalAPIError extends AppError {
    constructor(service, message = 'External service unavailable') {
        super(`${service}: ${message}`, 502);
        this.name = 'ExternalAPIError';
        this.service = service;
    }
}

/**
 * Handle different types of MongoDB/Mongoose errors
 */
const handleMongoError = (error) => {
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return new ValidationError('Validation failed', errors);
    }
    
    if (error.name === 'CastError') {
        return new ValidationError(`Invalid ${error.path}: ${error.value}`);
    }
    
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return new ValidationError(`Duplicate value for ${field}. Please use another value.`);
    }
    
    if (error.name === 'MongoNetworkError') {
        return new DatabaseError('Database connection failed');
    }
    
    return new DatabaseError('Database operation failed');
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Create standardized error response
 */
const createErrorResponse = (error, isDevelopment = false) => {
    const response = {
        success: false,
        message: error.message,
        timestamp: error.timestamp || new Date().toISOString(),
        ...(error.errors && { errors: error.errors })
    };
    
    if (isDevelopment && error.stack) {
        response.stack = error.stack;
    }
    
    return response;
};

/**
 * Log error with appropriate level
 */
const logError = (error, logger, context = {}) => {
    const logData = {
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
        timestamp: error.timestamp || new Date().toISOString(),
        context,
        ...(error.stack && { stack: error.stack })
    };
    
    if (error.statusCode >= 500) {
        logger.error('Server Error', logData);
    } else if (error.statusCode >= 400) {
        logger.warn('Client Error', logData);
    } else {
        logger.info('Application Error', logData);
    }
};

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    AuthenticationError,
    AuthorizationError,
    DatabaseError,
    ExternalAPIError,
    handleMongoError,
    asyncHandler,
    createErrorResponse,
    logError
};
