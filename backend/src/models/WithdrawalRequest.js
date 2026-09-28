const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['BID', 'ORDER'],
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Withdrawal reason is required'],
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewNotes: String,
  reviewedAt: Date,
}, { timestamps: true });

withdrawalRequestSchema.index({ entityType: 1, entityId: 1 });
withdrawalRequestSchema.index({ requestedBy: 1 });
withdrawalRequestSchema.index({ status: 1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
