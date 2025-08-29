require('dotenv').config();
const morgan = require('morgan');
const winston = require('winston');

const express = require('express');
const expressLayouts =  require('express-ejs-layouts');
const methodOverride = require('method-override');
const connectDB = require('./server/config/db');
const session = require('express-session');
const passport = require('passport');
// RedisStore and createClient will be required conditionally below

const app = express();
const port = process.env.PORT || 5000;

// trust reverse proxy (e.g., when deployed behind Nginx/Render/Heroku) so secure cookies work
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Winston logger setup
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


let sessionOptions = {
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  name: 'notes.sid',
  resave: false,
  saveUninitialized: false,
  rolling: true, // refresh cookie expiry on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    path: '/', // ensure cookie is available for all routes
    domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined
  },
};

if (process.env.NODE_ENV !== 'test') {
  const MongoStore = require('connect-mongo');
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
  touchAfter: 24 * 3600, // lazy session update
  ttl: 60 * 60 * 24 * 30, // persist sessions for 30 days in store
  autoRemove: 'native' // use MongoDB's TTL feature for cleanup
  });
  console.log('Using MongoDB for session storage');
}

app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());

//middlewares
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));

//connect to database
connectDB();

// API versioning
app.use('/api/v1/notes', require('./server/routes/api/v1/notes'));

//static files
app.use(express.static('public'));

//templating engine
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Centralized error handler (should be last)
const errorHandler = require('./server/middleware/errorHandler');
app.use(errorHandler);

//routes
app.use('/', require('./server/routes/auth'));
app.use('/', require('./server/routes/index'));
app.use('/', require('./server/routes/dashboard'));

//handle 404
app.get('*',function(req,res) {
   // res.status(404).send('404 page not found')
   const locals = {
        title: "404 - Page Not Found",
        description: "Page not found - NotesApp",
    }
   res.status(404).render('404', {
    locals,
    layout: './layouts/main'
   });
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`App listening on ${port}`);
  });
}

module.exports = app;