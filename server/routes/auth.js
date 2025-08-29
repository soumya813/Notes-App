const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userService = require('../services/userService');
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },

  async function(accessToken, refreshToken, profile, done) {
    console.log('Google profile:', JSON.stringify(profile, null, 2)); // Debug log
    
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    console.log('Extracted email:', email); // Debug log
    
    if (!email) {
      console.log('No email found in Google profile');
      return done(new Error('No email found in your Google account. Please use a Google account with a public email.'));
    }

    const newUser = {
      googleId: profile.id,
      displayName: profile.displayName,
      firstName: profile.name.givenName || 'User',
      lastName: profile.name.familyName || 'Unknown',
      profileImage: (profile.photos && profile.photos[0]) ? profile.photos[0].value : '/img/default-profile.png',
      email: email,
      profilePicture: (profile.photos && profile.photos[0]) ? profile.photos[0].value : '/img/default-profile.png',
      createdAt: new Date() 
    };
    
    console.log('Creating user with data:', JSON.stringify(newUser, null, 2)); // Debug log
    

    try {
      const user = await userService.findOrCreateGoogleUser(profile);
      done(null, user);
    } catch (error) {
      console.log(error);
      done(error, null);
    }
  }
));

//google login route
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

  //retrieve user data (Google OAuth callback)
router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/',
    successRedirect: '/dashboard'
  })
);

  //route if something goes wrong
  router.get('/login-failure',(req,res) => {
    res.send('Something went wrong...')
  });

  //destroy session
  router.get('/logout', (req,res) => {
    // Passport 0.7 requires callback
    req.logout(function(err){
      if (err) {
        console.log('Logout error:', err);
        return res.status(500).send('Error logging out');
      }
      req.session.destroy(error => {
        if(error){
          console.log(error);
          return res.status(500).send('Error logging out');
        }
        // Clear session cookie
        res.clearCookie('notes.sid');
        return res.redirect('/');
      });
    });
  })

  //persist user data after successful authentication
  passport.serializeUser(function(user, done){
    done(null, user.id);
  });

  //retrieve user data from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

module.exports = router; 