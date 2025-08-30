// User service for business logic
const User = require('../models/User');
const { validateGoogleProfile, isValidObjectId } = require('../utils/validation');
const { ValidationError, DatabaseError, NotFoundError } = require('../utils/errors');

/**
 * Find or create user from Google OAuth profile
 * @param {Object} profile - Google OAuth profile
 * @returns {Promise<Object>} User object
 */
const findOrCreateGoogleUser = async (profile) => {
  try {
    // Validate the Google profile
    const validation = validateGoogleProfile(profile);
    if (!validation.isValid) {
      throw new ValidationError('Invalid Google profile data', validation.errors);
    }

    const { email } = validation;

    // Prepare user data with proper fallbacks
    const userData = {
      googleId: profile.id,
      displayName: profile.displayName,
      firstName: profile.name?.givenName || 'User',
      lastName: profile.name?.familyName || 'Unknown',
      profileImage: profile.photos?.[0]?.value || '/img/default-profile.png',
      email: email.toLowerCase(),
      profilePicture: profile.photos?.[0]?.value || '/img/default-profile.png',
      lastLoginAt: new Date()
    };

    // Try to find existing user by googleId first (most reliable)
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      // Update last login and any changed profile data
      user.lastLoginAt = new Date();
      user.displayName = userData.displayName;
      user.firstName = userData.firstName;
      user.lastName = userData.lastName;
      user.profileImage = userData.profileImage;
      user.profilePicture = userData.profilePicture;
      
      await user.save();
      return user;
    }

    // If not found by googleId, check by email (user might have had account created differently)
    user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // Update existing user with Google data
      user.googleId = profile.id;
      user.displayName = userData.displayName;
      user.firstName = userData.firstName;
      user.lastName = userData.lastName;
      user.profileImage = userData.profileImage;
      user.profilePicture = userData.profilePicture;
      user.lastLoginAt = new Date();
      
      await user.save();
      return user;
    }

    // Create new user
    user = await User.create(userData);
    return user;

  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new ValidationError('User validation failed', Object.values(error.errors).map(e => e.message));
    }
    
    if (error.code === 11000) {
      // Handle duplicate key error
      const field = Object.keys(error.keyValue)[0];
      throw new ValidationError(`A user with this ${field} already exists`);
    }
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new DatabaseError('Failed to create or update user account');
  }
};

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
const findUserById = async (userId) => {
  try {
    if (!isValidObjectId(userId)) {
      return null; // Return null for invalid IDs instead of throwing
    }
    
    const user = await User.findById(userId);
    return user; // Will be null if not found, which is fine
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null; // Return null on any error to prevent session issues
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user object
 */
const updateUserProfile = async (userId, updateData) => {
  try {
    // Filter allowed fields
    const allowedFields = ['displayName', 'firstName', 'lastName', 'profileImage', 'profilePicture'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    const user = await User.findByIdAndUpdate(
      userId,
      filteredData,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new ValidationError('User validation failed', Object.values(error.errors).map(e => e.message));
    }
    
    if (error instanceof NotFoundError) {
      throw error;
    }
    
    throw new DatabaseError('Failed to update user profile');
  }
};

/**
 * Deactivate user account (soft delete)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user object
 */
const deactivateUser = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to deactivate user account');
  }
};

module.exports = {
  findOrCreateGoogleUser,
  findUserById,
  updateUserProfile,
  deactivateUser
};
