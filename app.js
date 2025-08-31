require('dotenv').config();

const express = require('express');
const http = require('http');
const expressLayouts =  require('express-ejs-layouts');
const methodOverride = require('method-override');
const { connectDB } = require('./server/config/db');
const { getConfig } = require('./server/config/config');
const session = require('express-session');
const passport = require('passport');

const app = express();
const server = http.createServer(app);
const config = getConfig();

// Trust reverse proxy (e.g., when deployed behind Nginx/Render/Heroku) so secure cookies work
if (config.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Winston logger setup
const winston = require('winston');
const morgan = require('morgan');

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

// Morgan HTTP request logger
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Session configuration
let sessionOptions = {
  secret: config.SESSION_SECRET,
  name: 'notes.sid',
  resave: false,
  saveUninitialized: false,
  rolling: true, // refresh cookie expiry on activity
  cookie: {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    path: '/', // ensure cookie is available for all routes
    domain: config.NODE_ENV === 'production' ? config.DOMAIN : undefined
  },
};

// Configure session store based on environment
if (config.NODE_ENV !== 'test') {
  const MongoStore = require('connect-mongo');
  sessionOptions.store = MongoStore.create({
    mongoUrl: config.MONGODB_URI,
    touchAfter: 24 * 3600, // lazy session update
    ttl: 60 * 60 * 24 * 30, // persist sessions for 30 days in store
    autoRemove: 'native' // use MongoDB's TTL feature for cleanup
  });
  console.log('Using MongoDB for session storage');
}

// Reuse the same session middleware for Express and Socket.IO
const sessionMiddleware = session(sessionOptions);
app.use(sessionMiddleware);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Session cleanup middleware to prevent infinite loops
const { preventInfiniteRedirects, validateUserSession } = require('./server/middleware/sessionCleanup');
app.use(preventInfiniteRedirects);
app.use(validateUserSession);

// Body parsing middleware
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride("_method"));

// Connect to database
connectDB();

// Static files
app.use(express.static('public'));

// Templating engine
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Security middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// API versioning
app.use('/api/v1/notes', require('./server/routes/api/v1/notes'));

// Routes
app.use('/', require('./server/routes/health'));
app.use('/', require('./server/routes/auth'));
app.use('/', require('./server/routes/index'));
app.use('/', require('./server/routes/dashboard'));
app.use('/', require('./server/routes/share'));

// Handle 404 - This should be after all other routes
app.get('*', function(req, res) {
   const locals = {
        title: "404 - Page Not Found",
        description: "Page not found - NotesApp",
    };
   res.status(404).render('404', {
    locals,
    layout: './layouts/main'
   });
});

// Centralized error handler (should be last middleware)
const errorHandler = require('./server/middleware/errorHandler');
app.use(errorHandler);

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Global unhandled rejection handler
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Initialize Socket.IO and real-time features
const { initSockets } = require('./server/sockets');
initSockets({ server, sessionMiddleware, passport });

if (config.NODE_ENV !== 'test') {
  server.listen(config.PORT, () => {
    console.log(`App listening on ${config.PORT}`);
  });
}

module.exports = app;