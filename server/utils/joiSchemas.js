const Joi = require('joi');

/**
 * Joi validation schemas for notezy
 */

// MongoDB ObjectId validation
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ID format');

// User validation schemas
const userSchemas = {
    // Google OAuth profile validation
    googleProfile: Joi.object({
        id: Joi.string().required(),
        displayName: Joi.string().required(),
        name: Joi.object({
            givenName: Joi.string().allow(''),
            familyName: Joi.string().allow('')
        }),
        emails: Joi.array().items(
            Joi.object({
                value: Joi.string().email().required()
            })
        ).min(1).required(),
        photos: Joi.array().items(
            Joi.object({
                value: Joi.string().uri()
            })
        ).optional()
    }),

    // User update data
    updateProfile: Joi.object({
        displayName: Joi.string().trim().min(1).max(100),
        firstName: Joi.string().trim().min(1).max(50),
        lastName: Joi.string().trim().min(1).max(50),
        profileImage: Joi.string().uri(),
        profilePicture: Joi.string().uri()
    }).min(1) // At least one field must be present
};

// Note validation schemas
const noteSchemas = {
    // Create note
    create: Joi.object({
        title: Joi.string().trim().min(1).max(200).required()
            .messages({
                'string.empty': 'Title is required',
                'string.min': 'Title must be at least 1 character long',
                'string.max': 'Title cannot exceed 200 characters',
                'any.required': 'Title is required'
            }),
        body: Joi.string().trim().min(1).max(50000).required()
            .messages({
                'string.empty': 'Note content is required',
                'string.min': 'Note content must be at least 1 character long',
                'string.max': 'Note content cannot exceed 50,000 characters',
                'any.required': 'Note content is required'
            }),
        tags: Joi.array().items(
            Joi.string().trim().max(50)
        ).max(10).optional()
    }),

    // Update note
    update: Joi.object({
        title: Joi.string().trim().min(1).max(200)
            .messages({
                'string.empty': 'Title cannot be empty',
                'string.min': 'Title must be at least 1 character long',
                'string.max': 'Title cannot exceed 200 characters'
            }),
        body: Joi.string().trim().min(1).max(50000)
            .messages({
                'string.empty': 'Note content cannot be empty',
                'string.min': 'Note content must be at least 1 character long',
                'string.max': 'Note content cannot exceed 50,000 characters'
            }),
        summary: Joi.string().trim().max(5000).allow(''),
        tags: Joi.array().items(
            Joi.string().trim().max(50)
        ).max(10),
        isArchived: Joi.boolean()
    }).min(1) // At least one field must be present
};

// Search and query validation
const querySchemas = {
    // Pagination
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        perPage: Joi.number().integer().min(1).max(50).default(12),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title').default('updatedAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    }),

    // Search
    search: Joi.object({
        searchTerm: Joi.string().trim().min(1).max(100).required()
            .messages({
                'string.empty': 'Search term is required',
                'string.min': 'Search term must be at least 1 character long',
                'string.max': 'Search term is too long (max 100 characters)',
                'any.required': 'Search term is required'
            })
    }),

    // Summarization request
    summarize: Joi.object({
        text: Joi.string().trim().min(50).max(50000).required()
            .messages({
                'string.empty': 'Text content is required for summarization',
                'string.min': 'Text must be at least 50 characters long for meaningful summarization',
                'string.max': 'Text is too long for summarization (max 50,000 characters)',
                'any.required': 'Text content is required for summarization'
            }),
        noteId: objectId.optional()
    })
};

// Parameter validation
const paramSchemas = {
    objectId: Joi.object({
        id: objectId.required()
    })
};

/**
 * Validation middleware factory
 */
const createValidationMiddleware = (schema, source = 'body') => {
    return (req, res, next) => {
        const data = source === 'params' ? req.params : 
                    source === 'query' ? req.query : req.body;

        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errors = error.details.map(detail => detail.message);
            const validationError = new (require('../utils/errors').ValidationError)(
                'Validation failed',
                errors
            );
            return next(validationError);
        }

        // Replace the source data with validated and sanitized data
        if (source === 'params') {
            req.params = value;
        } else if (source === 'query') {
            req.query = value;
        } else {
            req.body = value;
        }

        next();
    };
};

module.exports = {
    schemas: {
        user: userSchemas,
        note: noteSchemas,
        query: querySchemas,
        param: paramSchemas
    },
    validate: createValidationMiddleware,
    objectId
};
