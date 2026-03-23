const User = require('../models/User');

/**
 * Find or create a user via Google OAuth
 * @param {string} googleId - Google user ID
 * @param {string} email - User email from Google
 * @param {string} name - User name from Google
 * @param {string} picture - User profile picture URL
 * @returns {Promise<Object>} User object with token
 */
const findOrCreateGoogleUser = async (googleId, email, name, picture) => {
  try {
    // Try to find existing user by googleId
    let user = await User.findOne({ googleId });
    
    if (user) {
      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          balance: user.balance,
          preferences: user.preferences,
          avatar: user.avatar,
        },
        token: user.generateToken(),
      };
    }

    // Check if email is already registered (regardless of provider)
    user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // Update googleId if not already set and update avatar if provided
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.avatar) {
          user.avatar = picture;
        }
        await user.save();
      }
      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          balance: user.balance,
          preferences: user.preferences,
          avatar: user.avatar,
        },
        token: user.generateToken(),
      };
    }

    // Create new user
    user = await User.create({
      name,
      email: email.toLowerCase(),
      googleId,
      oauthProvider: 'google',
      avatar: picture || '',
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        preferences: user.preferences,
        avatar: user.avatar,
      },
      token: user.generateToken(),
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  findOrCreateGoogleUser,
};
