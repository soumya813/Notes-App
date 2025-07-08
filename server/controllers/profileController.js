const User = require('../models/User');
const Note = require('../models/Notes');
const fs = require('fs');
const path = require('path');

exports.getProfile = async (req, res) => {
  res.render('profile', {
    user: req.user,
    error: undefined,
    layout: '../views/layouts/dashboard'
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const update = { email: req.body.email };
    if (req.file) {
      update.profilePicture = '/uploads/' + req.file.filename;
    }
    await User.findByIdAndUpdate(req.user.id, update);
    res.redirect('/profile');
  } catch (err) {
    res.render('profile', {
      user: req.user,
      error: 'Failed to update profile.',
      layout: '../views/layouts/dashboard'
    });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    // Delete all notes
    await Note.deleteMany({ user: req.user.id });
    // Delete user
    await User.findByIdAndDelete(req.user.id);
    req.logout(() => {
      res.redirect('/?msg=Account deleted');
    });
  } catch (err) {
    res.render('profile', {
      user: req.user,
      error: 'Failed to delete account.',
      layout: '../views/layouts/dashboard'
    });
  }
}; 