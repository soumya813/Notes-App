const winston = require('winston');
const { handleMongoError, createErrorResponse, logError } = require('../utils/errors');

// Setup logger for error handling
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
});

/**
 * Centralized error handler middleware
 */
module.exports = (err, req, res, next) => {
  let error = err;
  
  // Handle Mongoose/MongoDB errors
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000 || err.name === 'MongoNetworkError') {
    error = handleMongoError(err);
  }
  
  // Set default error properties if not already set
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  
  if (!error.message) {
    error.message = 'Internal Server Error';
  }
  
  // Log the error
  const context = {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  };
  
  logError(error, logger, context);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = createErrorResponse(error, isDevelopment);
  
  // Handle API requests (JSON response)
  if (req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
    return res.status(error.statusCode).json(errorResponse);
  }
  
  // Handle web requests (render error page)
  if (error.statusCode === 404) {
    return res.status(404).render('404', {
      locals: {
        title: "404 - Page Not Found",
        description: "Page not found - NotesApp",
      },
      layout: './layouts/main'
    });
  }
  
  // For other errors, redirect to appropriate page with error message
  if (req.user) {
    // Authenticated users - redirect to dashboard with error
    req.session.errorMessage = errorResponse.message;
    return res.redirect('/dashboard?error=1');
  } else {
    // Unauthenticated users - redirect to home with error
    req.session.errorMessage = errorResponse.message;
    return res.redirect('/?error=1');
  }
};
