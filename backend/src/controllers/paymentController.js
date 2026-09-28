const Payment = require('../models/Payment');
const Order = require('../models/Order');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const ApiResponse = require('../utils/ApiResponse');
const { v4: uuidv4 } = require('uuid');

// Get payments
exports.getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('order')
      .populate('buyer', 'name email company')
      .populate('supplier', 'name email company')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return ApiResponse.paginated(res, payments, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order')
      .populate('buyer', 'name email company')
      .populate('supplier', 'name email company')
      .populate('processedBy', 'name');

    if (!payment) return ApiResponse.notFound(res, 'Payment not found.');
    return ApiResponse.success(res, payment);
  } catch (error) {
    next(error);
  }
};

// Process payment (initiate)
exports.processPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return ApiResponse.notFound(res, 'Payment not found.');

    if (payment.status !== 'PENDING') {
      return ApiResponse.badRequest(res, `Cannot process payment in ${payment.status} status.`);
    }

    payment.status = 'PROCESSING';
    payment.processedBy = req.user._id;
    payment.transactionReference = `TXN-${uuidv4().substring(0, 8).toUpperCase()}`;
    await payment.save();

    // Update order
    await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'PROCESSING' });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'PAYMENT_PROCESSED',
      entityType: 'PAYMENT',
      entityId: payment._id,
      description: `Payment processing initiated. Amount: ₹${payment.amount.toLocaleString()}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, payment, 'Payment processing initiated.');
  } catch (error) {
    next(error);
  }
};

// Mock payment success
exports.mockPaymentSuccess = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return ApiResponse.notFound(res, 'Payment not found.');

    if (!['PENDING', 'PROCESSING'].includes(payment.status)) {
      return ApiResponse.badRequest(res, `Cannot complete payment in ${payment.status} status.`);
    }

    payment.status = 'PAID';
    payment.processedBy = req.user._id;
    payment.processedAt = new Date();
    if (!payment.transactionReference) {
      payment.transactionReference = `TXN-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
    await payment.save();

    // Update order
    const order = await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: 'PAID',
      status: 'PAID',
    }, { new: true });

    // Notify supplier
    if (order) {
      await NotificationService.create({
        recipient: order.supplier,
        type: 'PAYMENT_PROCESSED',
        title: 'Payment Received',
        message: `Payment of ₹${payment.amount.toLocaleString()} has been processed successfully.`,
        data: { entityType: 'PAYMENT', entityId: payment._id },
      });
    }

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'PAYMENT_PROCESSED',
      entityType: 'PAYMENT',
      entityId: payment._id,
      description: `Payment completed (MOCK). Amount: ₹${payment.amount.toLocaleString()}. Ref: ${payment.transactionReference}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, payment, '[DEMO] Payment marked as successful.');
  } catch (error) {
    next(error);
  }
};

// Mock payment failure
exports.mockPaymentFailure = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return ApiResponse.notFound(res, 'Payment not found.');

    if (!['PENDING', 'PROCESSING'].includes(payment.status)) {
      return ApiResponse.badRequest(res, `Cannot fail payment in ${payment.status} status.`);
    }

    payment.status = 'FAILED';
    payment.processedBy = req.user._id;
    payment.processedAt = new Date();
    payment.failureReason = req.body.reason || 'Mock payment failure';
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'FAILED' });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'PAYMENT_FAILED',
      entityType: 'PAYMENT',
      entityId: payment._id,
      description: `Payment failed (MOCK). Amount: ₹${payment.amount.toLocaleString()}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, payment, '[DEMO] Payment marked as failed.');
  } catch (error) {
    next(error);
  }
};
