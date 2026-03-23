const express = require('express');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Watchlist = require('../models/Watchlist');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });

    // Initialize portfolio and watchlist
    await Portfolio.create({ user: user._id, holdings: [] });
    await Watchlist.create({
      user: user._id,
      name: 'My Watchlist',
      stocks: [
        { symbol: 'RELIANCE', name: 'Reliance Industries' },
        { symbol: 'TCS', name: 'Tata Consultancy Services' },
        { symbol: 'INFY', name: 'Infosys' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank' },
        { symbol: 'ITC', name: 'ITC Limited' },
      ],
    });

    const token = user.generateToken();
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, balance: user.balance },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = user.generateToken();
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, balance: user.balance },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      balance: req.user.balance,
      preferences: req.user.preferences,
    },
  });
});

router.put('/preferences', protect, async (req, res) => {
  try {
    const { theme, notifications, defaultChart } = req.body;
    req.user.preferences = { ...req.user.preferences, theme, notifications, defaultChart };
    await req.user.save();
    res.json({ preferences: req.user.preferences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
