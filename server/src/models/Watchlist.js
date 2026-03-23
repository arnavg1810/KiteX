const mongoose = require('mongoose');

const watchlistStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
  sortOrder: { type: Number, default: 0 },
});

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    default: 'My Watchlist',
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  stocks: [watchlistStockSchema],
}, { timestamps: true });

watchlistSchema.index({ user: 1, order: 1 });

const MAX_WATCHLISTS_PER_USER = 5;

module.exports = mongoose.model('Watchlist', watchlistSchema);
module.exports.MAX_WATCHLISTS_PER_USER = MAX_WATCHLISTS_PER_USER;
