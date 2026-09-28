const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  actorName: String,
  role: {
    type: String,
    enum: ['ADMIN', 'BUYER', 'PROCUREMENT_OFFICER', 'VENDOR', 'FINANCE_OFFICER', 'AUCTION_AUDITOR', 'GUEST', 'SYSTEM'],
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'USER_CREATED', 'USER_UPDATED', 'USER_DISABLED',
      'REQUIREMENT_CREATED', 'REQUIREMENT_UPDATED', 'REQUIREMENT_SUBMITTED',
      'REQUIREMENT_APPROVED', 'REQUIREMENT_REJECTED', 'REQUIREMENT_REVISION_REQUESTED',
      'AUCTION_CREATED', 'AUCTION_UPDATED', 'AUCTION_PUBLISHED', 'AUCTION_STARTED',
      'AUCTION_CLOSED', 'AUCTION_CANCELLED',
      'BID_SUBMITTED', 'BID_ACCEPTED', 'BID_REJECTED', 'BID_WITHDRAWAL_REQUESTED',
      'BID_WITHDRAWAL_APPROVED', 'BID_WITHDRAWAL_REJECTED',
      'WINNER_SELECTED', 'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_APPROVED',
      'PAYMENT_CREATED', 'PAYMENT_PROCESSED', 'PAYMENT_FAILED',
      'FULFILLMENT_UPDATED', 'DELIVERY_COMPLETED',
      'WITHDRAWAL_REQUESTED', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED',
      'CATEGORY_CREATED', 'CATEGORY_UPDATED',
      'SYSTEM_ACTION',
    ],
  },
  entityType: {
    type: String,
    enum: ['USER', 'REQUIREMENT', 'AUCTION', 'BID', 'ORDER', 'PAYMENT', 'CATEGORY', 'NOTIFICATION', 'SYSTEM'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  description: {
    type: String,
    required: true,
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: String,
  userAgent: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ entityId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ role: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
