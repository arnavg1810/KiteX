const mongoose = require('mongoose');

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
  stocks: [{
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

watchlistSchema.index({ user: 1 });

module.exports = mongoose.model('Watchlist', watchlistSchema);
