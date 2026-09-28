const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true,
  },
  requirement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcurementRequirement',
    required: true,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  winningBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  deliveryLocation: {
    type: String,
    required: true,
  },
  deliveryDeadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: [
      'CREATED', 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PENDING',
      'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED',
      'CANCELLED', 'DISPUTED',
    ],
    default: 'CREATED',
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  },
  fulfillmentStatus: {
    type: String,
    enum: [
      'ASSIGNED', 'ACCEPTED', 'PROCESSING', 'READY_FOR_DELIVERY',
      'DELIVERED', 'COMPLETED', 'WITHDRAWAL_REQUESTED',
      'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED',
    ],
    default: 'ASSIGNED',
  },
  trackingInfo: {
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    notes: String,
  },
  withdrawalRequest: {
    reason: String,
    requestedAt: Date,
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'] },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  notes: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
}, { timestamps: true });

orderSchema.index({ buyer: 1 });
orderSchema.index({ supplier: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ auction: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
