/**
 * Application configuration with validation
 */
const requiredEnvVars = [
  'MONGODB_URI',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL'
];

const optionalEnvVars = {
  'NODE_ENV': 'development',
  'PORT': '5000',
  'SESSION_SECRET': 'keyboard cat',
  'DOMAIN': undefined,
  'HUGGING_FACE_API': undefined,
  'REDIS_URL': undefined,
  'SMTP_HOST': undefined,
  'SMTP_PORT': undefined,
  'SMTP_USER': undefined,
  'SMTP_PASS': undefined,
  'SMTP_FROM': undefined
};

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'keyboard cat') {
      throw new Error('SESSION_SECRET must be set to a secure random string in production');
    }
    
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      console.warn('WARNING: SESSION_SECRET should be at least 32 characters long for security');
    }
  }
}

/**
 * Get configuration with defaults
 */
function getConfig() {
  if (process.env.NODE_ENV !== 'test') {
    validateEnvironment();
  }
  
  return {
    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT) || 5000,
    
    // Database
    MONGODB_URI: process.env.MONGODB_URI,
    
    // Session
    SESSION_SECRET: process.env.SESSION_SECRET || 'keyboard cat',
    DOMAIN: process.env.DOMAIN,
    
    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    
    // External APIs
    HUGGING_FACE_API: process.env.HUGGING_FACE_API,
    
    // Redis (optional)
    REDIS_URL: process.env.REDIS_URL,
    // Email (optional)
    MAIL: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || 'no-reply@notes-app.local'
    },
    
    // Security settings
    SECURITY: {
      rateLimitWindow: 15 * 60 * 1000, // 15 minutes
      rateLimitRequests: 100, // requests per window
      sensitiveOpsLimit: 5, // sensitive operations per window
      maxLoginAttempts: 5,
      loginAttemptWindow: 15 * 60 * 1000 // 15 minutes
    },
    
    // Application settings
    APP: {
      defaultPerPage: 12,
      maxPerPage: 50,
      maxNoteLength: 50000,
      maxTitleLength: 200,
      maxSummaryLength: 5000,
      searchResultLimit: 100
    }
  };
}

module.exports = {
  getConfig,
  validateEnvironment
};
