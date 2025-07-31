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
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 day
};

if (process.env.NODE_ENV !== 'test') {
  const RedisStore = require('connect-redis')(session);
  const { createClient } = require('redis');
  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  redisClient.connect().catch(console.error);
  sessionOptions.store = new RedisStore({ client: redisClient });
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