const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 5000,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  productType: {
    type: String,
    enum: ['PRODUCT', 'SERVICE', 'BOTH'],
    default: 'PRODUCT',
  },
  items: [{
    name: { type: String, required: true },
    description: String,
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'units' },
    specifications: String,
  }],
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit: {
    type: String,
    default: 'units',
  },
  specifications: {
    type: String,
    maxlength: 5000,
  },
  estimatedBudget: {
    type: Number,
    required: [true, 'Estimated budget is required'],
    min: 0,
  },
  minimumBudget: {
    type: Number,
    min: 0,
  },
  maximumBudget: {
    type: Number,
    min: 0,
  },
  deliveryLocation: {
    type: String,
    required: [true, 'Delivery location is required'],
  },
  deliveryDeadline: {
    type: Date,
    required: [true, 'Delivery deadline is required'],
  },
  eligibilityRequirements: {
    type: String,
    maxlength: 2000,
  },
  auctionStartDate: {
    type: Date,
  },
  auctionEndDate: {
    type: Date,
  },
  minimumBidDecrement: {
    type: Number,
    min: 0,
    default: 0,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  vendorEligibilityCriteria: {
    type: String,
    maxlength: 2000,
  },
  documents: [{
    name: String,
    path: String,
    type: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
  }],
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
    default: 'DRAFT',
  },
  review: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['APPROVE', 'REJECT', 'REQUEST_REVISION'] },
    reason: String,
    reviewedAt: Date,
  },
  reviewHistory: [{
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['APPROVE', 'REJECT', 'REQUEST_REVISION'] },
    reason: String,
    reviewedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

requirementSchema.index({ buyer: 1 });
requirementSchema.index({ status: 1 });
requirementSchema.index({ category: 1 });
requirementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProcurementRequirement', requirementSchema);
