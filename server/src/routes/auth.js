const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { findOrCreateGoogleUser } = require('../services/oauthService');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const errorMsg = existing.oauthProvider === 'google' 
        ? 'Email already registered with Google. Please sign in with Google.' 
        : 'Email already registered';
      return res.status(400).json({ error: errorMsg });
    }
    const user = await User.create({ name, email: email.toLowerCase(), password, oauthProvider: 'local' });
    const token = user.generateToken();
    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, balance: user.balance, preferences: user.preferences },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = user.generateToken();
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, balance: user.balance, preferences: user.preferences },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/preferences', protect, async (req, res) => {
  try {
    const { theme, notifications, defaultChart } = req.body;
    if (theme !== undefined) req.user.preferences.theme = theme;
    if (notifications !== undefined) req.user.preferences.notifications = notifications;
    if (defaultChart !== undefined) req.user.preferences.defaultChart = defaultChart;
    await req.user.save();
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google OAuth route
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;
    
    if (!googleId || !email) {
      return res.status(400).json({ error: 'googleId and email are required' });
    }

    const result = await findOrCreateGoogleUser(googleId, email, name, picture);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
