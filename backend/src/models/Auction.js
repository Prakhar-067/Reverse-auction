const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: [true, 'Auction title is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    maxlength: 5000,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  startingPrice: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: 0,
  },
  currentLowestBid: {
    type: Number,
    default: null,
  },
  minimumBidDecrement: {
    type: Number,
    default: 0,
    min: 0,
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
  },
  status: {
    type: String,
    enum: [
      'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'OPEN',
      'CLOSED', 'UNDER_EVALUATION', 'WINNER_SELECTED', 'ORDER_CREATED',
      'COMPLETED', 'CANCELLED', 'SUSPENDED',
    ],
    default: 'DRAFT',
  },
  eligibilityRequirements: {
    type: String,
    maxlength: 2000,
  },
  visibility: {
    type: String,
    enum: ['PUBLIC', 'PRIVATE'],
    default: 'PUBLIC',
  },
  eligibleVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  participants: [{
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
  }],
  winner: {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
    amount: Number,
    selectedAt: Date,
    selectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  totalBids: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

auctionSchema.index({ status: 1 });
auctionSchema.index({ startTime: 1 });
auctionSchema.index({ endTime: 1 });
auctionSchema.index({ buyer: 1 });
auctionSchema.index({ category: 1 });
auctionSchema.index({ 'winner.vendor': 1 });

module.exports = mongoose.model('Auction', auctionSchema);
