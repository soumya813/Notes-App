const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userService = require('../services/userService');
const User = require('../models/User');
const { asyncHandler } = require('../utils/errors');
const { ValidationError } = require('../utils/errors');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      console.log('Google OAuth - Processing profile:', profile.id);
      
      const user = await userService.findOrCreateGoogleUser(profile);
      console.log('Google OAuth - User processed successfully:', user.id);
      
      done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Authentication failed. Please try again.';
      
      if (error instanceof ValidationError) {
        if (error.message.includes('email')) {
          userMessage = 'Unable to access your email from Google. Please ensure your Google account has a public email address.';
        } else {
          userMessage = 'Invalid profile information from Google. Please try again.';
        }
      } else if (error.code === 11000) {
        userMessage = 'An account with this information already exists. Please try logging in.';
      }
      
      // Create error object with user-friendly message
      const authError = new Error(userMessage);
      authError.statusCode = 400;
      done(authError, null);
    }
  }
));

// Google login route
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Retrieve user data (Google OAuth callback)
router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login-failure'
  }),
  asyncHandler(async (req, res) => {
    // Update last login time
    if (req.user) {
      try {
        await req.user.updateLastLogin();
      } catch (error) {
        console.warn('Failed to update last login time:', error);
        // Don't fail the login for this
      }
    }
    
    // Redirect to intended page or dashboard
    const redirectTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  })
);

// Route if authentication fails
router.get('/login-failure', (req, res) => {
  const locals = {
  title: "Login Failed - Notezy",
  description: "Authentication failed - Notezy",
  };
  
  res.status(400).render('index', {
    locals,
    layout: './layouts/main',
    error: 'Login failed. Please try again or contact support if the problem persists.'
  });
});

// Destroy session (logout)
router.get('/logout', (req, res) => {
  // Passport 0.7 requires callback
  req.logout(function(err) {
    if (err) {
      console.error('Logout error:', err);
      // Still try to destroy session even if logout fails
    }
    
    req.session.destroy(error => {
      if (error) {
        console.error('Session destroy error:', error);
        // Still try to logout by clearing cookie and redirecting
      }
      
      // Clear session cookie
      res.clearCookie('notes.sid');
      res.redirect('/?message=logged-out');
    });
  });
});

// Persist user data after successful authentication
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// Retrieve user data from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userService.findUserById(id);
    done(null, user);
  } catch (error) {
    console.error('Deserialize user error:', error);
    // Return null user instead of error to prevent session issues
    done(null, null);
  }
});

module.exports = router; 