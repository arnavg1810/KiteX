const express = require('express');
const Watchlist = require('../models/Watchlist');
const { protect } = require('../middleware/auth');
const stockService = require('../services/stockService');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) {
      watchlist = await Watchlist.create({
        user: req.user._id,
        name: 'My Watchlist',
        stocks: [],
      });
    }

    // Enrich with live quotes
    const enriched = await Promise.all(
      watchlist.stocks.map(async (s) => {
        const quote = await stockService.getQuote(s.symbol);
        return { ...s.toObject(), quote };
      })
    );

    res.json({ watchlist: { ...watchlist.toObject(), stocks: enriched } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/add', protect, async (req, res) => {
  try {
    const { symbol, name } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    let watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: req.user._id, stocks: [] });
    }

    if (watchlist.stocks.some((s) => s.symbol === symbol.toUpperCase())) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }

    watchlist.stocks.push({ symbol: symbol.toUpperCase(), name: name || symbol });
    await watchlist.save();

    res.json({ message: 'Added to watchlist', watchlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/remove/:symbol', protect, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) return res.status(404).json({ error: 'Watchlist not found' });

    watchlist.stocks = watchlist.stocks.filter(
      (s) => s.symbol !== req.params.symbol.toUpperCase()
    );
    await watchlist.save();

    res.json({ message: 'Removed from watchlist', watchlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
