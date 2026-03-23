const express = require('express');
const Watchlist = require('../models/Watchlist');
const { protect } = require('../middleware/auth');
const stockService = require('../services/stockService');

const router = express.Router();
const MAX_WATCHLISTS = Watchlist.MAX_WATCHLISTS_PER_USER || 5;

async function ensureDefaultWatchlist(userId) {
  let lists = await Watchlist.find({ user: userId }).sort({ order: 1 });
  if (lists.length === 0) {
    await Watchlist.create({
      user: userId,
      name: 'My Watchlist',
      order: 0,
      stocks: [],
    });
    lists = await Watchlist.find({ user: userId }).sort({ order: 1 });
  }
  return lists;
}

async function enrichStocks(stocks) {
  if (!stocks || stocks.length === 0) return [];
  return Promise.all(
    stocks.map(async (s) => {
      try {
        const quote = await stockService.getQuote(s.symbol);
        return { ...s.toObject(), quote };
      } catch {
        return { ...s.toObject(), quote: null };
      }
    })
  );
}

// GET /watchlist — returns all watchlists for user (max 5)
router.get('/', protect, async (req, res) => {
  try {
    const lists = await ensureDefaultWatchlist(req.user._id);
    const watchlists = await Promise.all(
      lists.map(async (wl) => ({
        ...wl.toObject(),
        stocks: await enrichStocks(wl.stocks),
      }))
    );
    res.json({ watchlists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /watchlist — create new watchlist (name in body)
router.post('/', protect, async (req, res) => {
  try {
    const count = await Watchlist.countDocuments({ user: req.user._id });
    if (count >= MAX_WATCHLISTS) {
      return res.status(400).json({ error: `Maximum ${MAX_WATCHLISTS} watchlists allowed` });
    }
    const name = (req.body.name || 'New Watchlist').trim();
    const list = await Watchlist.create({
      user: req.user._id,
      name,
      order: count,
      stocks: [],
    });
    res.status(201).json({ watchlist: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy: POST /watchlist/add — add to first (default) watchlist (must be before /:id/add)
router.post('/add', protect, async (req, res) => {
  try {
    const { symbol, name } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });
    const lists = await ensureDefaultWatchlist(req.user._id);
    const list = lists[0];
    const sym = symbol.toUpperCase();
    if (list.stocks.some((s) => s.symbol === sym)) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }
    list.stocks.push({ symbol: sym, name: name || sym, sortOrder: list.stocks.length });
    await list.save();
    const enriched = await enrichStocks(list.stocks);
    res.json({ message: 'Added to watchlist', watchlist: { ...list.toObject(), stocks: enriched } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy: DELETE /watchlist/remove/:symbol — remove from first watchlist (must be before /:id/remove/:symbol)
router.delete('/remove/:symbol', protect, async (req, res) => {
  try {
    const lists = await ensureDefaultWatchlist(req.user._id);
    const list = lists[0];
    const sym = req.params.symbol.toUpperCase();
    list.stocks = list.stocks.filter((s) => s.symbol !== sym);
    await list.save();
    const enriched = await enrichStocks(list.stocks);
    res.json({ message: 'Removed from watchlist', watchlist: { ...list.toObject(), stocks: enriched } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /watchlist/:id — rename and/or reorder stocks (body: name?, stocks? [ { symbol, name, sortOrder } ])
router.put('/:id', protect, async (req, res) => {
  try {
    const list = await Watchlist.findOne({ _id: req.params.id, user: req.user._id });
    if (!list) return res.status(404).json({ error: 'Watchlist not found' });

    if (req.body.name !== undefined) list.name = String(req.body.name).trim();
    if (Array.isArray(req.body.stocks)) {
      list.stocks = req.body.stocks.map((s, i) => ({
        symbol: s.symbol || s,
        name: s.name || s.symbol || s,
        sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : i,
        addedAt: list.stocks.find((x) => x.symbol === (s.symbol || s))?.addedAt || new Date(),
      }));
    }
    await list.save();
    const enriched = await enrichStocks(list.stocks);
    res.json({ watchlist: { ...list.toObject(), stocks: enriched } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /watchlist/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const list = await Watchlist.findOne({ _id: req.params.id, user: req.user._id });
    if (!list) return res.status(404).json({ error: 'Watchlist not found' });
    await Watchlist.deleteOne({ _id: req.params.id });
    const lists = await Watchlist.find({ user: req.user._id }).sort({ order: 1 });
    await Promise.all(lists.map((l, i) => Watchlist.updateOne({ _id: l._id }, { order: i })));
    res.json({ message: 'Deleted', watchlists: lists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /watchlist/:id/add — add stock to specific list
router.post('/:id/add', protect, async (req, res) => {
  try {
    const { symbol, name } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    const list = await Watchlist.findOne({ _id: req.params.id, user: req.user._id });
    if (!list) return res.status(404).json({ error: 'Watchlist not found' });

    const sym = symbol.toUpperCase();
    if (list.stocks.some((s) => s.symbol === sym)) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }
    list.stocks.push({
      symbol: sym,
      name: name || sym,
      sortOrder: list.stocks.length,
    });
    await list.save();
    const enriched = await enrichStocks(list.stocks);
    res.json({ watchlist: { ...list.toObject(), stocks: enriched } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /watchlist/:id/remove/:symbol
router.delete('/:id/remove/:symbol', protect, async (req, res) => {
  try {
    const list = await Watchlist.findOne({ _id: req.params.id, user: req.user._id });
    if (!list) return res.status(404).json({ error: 'Watchlist not found' });
    const sym = req.params.symbol.toUpperCase();
    list.stocks = list.stocks.filter((s) => s.symbol !== sym);
    await list.save();
    const enriched = await enrichStocks(list.stocks);
    res.json({ watchlist: { ...list.toObject(), stocks: enriched } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
