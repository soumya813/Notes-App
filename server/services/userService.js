// User service for business logic
const User = require('../models/User');

const findOrCreateGoogleUser = async (profile) => {
  const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
  if (!email) throw new Error('No email found in your Google account.');

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

  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create(newUser);
  }
  return user;
};

module.exports = {
  findOrCreateGoogleUser,
};
