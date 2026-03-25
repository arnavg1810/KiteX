const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token and extract user payload
 * @param {string} idToken - The raw credential token from Google Sign-In
 * @returns {Promise<Object>} Verified user payload
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    console.error('Google token verification failed:', error.message);
    throw new Error('Invalid Google token. Please try signing in again.');
  }
};

/**
 * Find or create a user via Google OAuth
 * @param {string} idToken - Raw Google credential token
 * @returns {Promise<Object>} User object with JWT token
 */
const findOrCreateGoogleUser = async (idToken) => {
  // Step 1: Verify the token server-side
  const { googleId, email, name, picture } = await verifyGoogleToken(idToken);

  // Step 2: Try to find existing user by googleId
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

  // Step 3: Check if email is already registered
  user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    // Link Google account to existing email account
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

  // Step 4: Create new user
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
};

module.exports = {
  findOrCreateGoogleUser,
};
