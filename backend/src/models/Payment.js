const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  method: {
    type: String,
    enum: ['BANK_TRANSFER', 'CREDIT_CARD', 'UPI', 'NET_BANKING', 'MOCK'],
    default: 'MOCK',
  },
  transactionReference: {
    type: String,
    unique: true,
    sparse: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  processedAt: Date,
  failureReason: String,
  notes: String,
}, { timestamps: true });

paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ processedBy: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
