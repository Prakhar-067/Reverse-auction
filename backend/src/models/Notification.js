const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'REQUIREMENT_SUBMITTED', 'REQUIREMENT_APPROVED', 'REQUIREMENT_REJECTED',
      'REQUIREMENT_REVISION', 'AUCTION_PUBLISHED', 'AUCTION_STARTING_SOON',
      'AUCTION_STARTED', 'NEW_BID', 'OUTBID', 'AUCTION_ENDING_SOON',
      'AUCTION_CLOSED', 'AUCTION_WON', 'AUCTION_LOST', 'ORDER_CREATED',
      'PAYMENT_PROCESSED', 'PAYMENT_FAILED', 'SUPPLIER_ASSIGNED', 'VENDOR_ASSIGNED',
      'DELIVERY_UPDATED', 'WITHDRAWAL_REQUESTED', 'WITHDRAWAL_APPROVED',
      'WITHDRAWAL_REJECTED', 'SYSTEM', 'BID_ACCEPTED', 'BID_REJECTED',
      'WINNER_SELECTED', 'FULFILLMENT_UPDATED', 'ORDER_APPROVED',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    link: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
