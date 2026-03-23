const mongoose = require('mongoose');

const stockFnoCacheSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Symbol is required'],
    unique: true,
    uppercase: true,
  },
  series: {
    type: String,
    enum: ['1D', '1W', '1M'],
    default: '1D',
  },
  openInterest: {
    type: Number,
    default: 0,
  },
  oiChange: {
    type: Number,
    default: 0,
  },
  deliveryVolume: {
    type: Number,
    default: 0,
  },
  deliveryChange: {
    type: Number,
    default: 0,
  },
  deliveryPercent: {
    type: Number,
    default: 0,
  },
  oiTrend: [
    {
      date: Date,
      value: Number,
    },
  ],
  deliveryTrend: [
    {
      date: Date,
      percent: Number,
    },
  ],
  buildUp: {
    type: String,
    enum: ['long_buildup', 'short_buildup', 'short_covering', 'long_unwinding', 'none'],
    default: 'none',
  },
  from: Date,
  to: Date,
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// TTL index: auto-delete documents after 24 hours
stockFnoCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('StockFnoCache', stockFnoCacheSchema);
