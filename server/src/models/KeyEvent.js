const mongoose = require('mongoose');

const keyEventSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Symbol is required'],
    uppercase: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['earnings', 'dividend', 'corporate_action', 'regulatory', 'board_meeting', 'news'],
    required: [true, 'Event type is required'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  description: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    index: true,
  },
  source: {
    type: String,
    default: 'Company announcement',
  },
}, { timestamps: true });

// Index for efficient querying by symbol and date
keyEventSchema.index({ symbol: 1, date: -1 });

module.exports = mongoose.model('KeyEvent', keyEventSchema);
