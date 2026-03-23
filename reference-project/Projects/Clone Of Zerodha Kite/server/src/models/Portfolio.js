const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  name: String,
  quantity: { type: Number, required: true, min: 0 },
  avgPrice: { type: Number, required: true },
  investedValue: { type: Number, required: true },
});

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  holdings: [holdingSchema],
  totalInvested: { type: Number, default: 0 },
  totalPnL: { type: Number, default: 0 },
  dayPnL: { type: Number, default: 0 },
}, { timestamps: true });

portfolioSchema.index({ user: 1 });

module.exports = mongoose.model('Portfolio', portfolioSchema);
