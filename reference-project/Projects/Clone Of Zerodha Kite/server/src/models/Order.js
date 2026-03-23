const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  name: String,
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true,
  },
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
    default: 'MARKET',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  triggerPrice: Number,
  status: {
    type: String,
    enum: ['PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED'],
    default: 'EXECUTED',
  },
  executedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
