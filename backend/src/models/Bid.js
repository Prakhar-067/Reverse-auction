const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: 0,
  },
  status: {
    type: String,
    enum: ['VALID', 'INVALID', 'WINNING', 'OUTBID', 'WITHDRAWN', 'WITHDRAWAL_PENDING'],
    default: 'VALID',
  },
  isBinding: {
    type: Boolean,
    default: true,
  },
  validationResult: {
    isValid: { type: Boolean, default: true },
    message: String,
  },
  rank: {
    type: Number,
    default: 0,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

bidSchema.index({ auction: 1, vendor: 1 });
bidSchema.index({ auction: 1, amount: 1 });
bidSchema.index({ vendor: 1 });
bidSchema.index({ submittedAt: -1 });
bidSchema.index({ auction: 1, status: 1 });

module.exports = mongoose.model('Bid', bidSchema);
