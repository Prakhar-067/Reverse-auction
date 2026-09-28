const Order = require('../models/Order');
const Auction = require('../models/Auction');
const Payment = require('../models/Payment');
const ProcurementRequirement = require('../models/ProcurementRequirement');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const ApiResponse = require('../utils/ApiResponse');

// Get orders
exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'BUYER') query.buyer = req.user._id;
    if (req.user.role === 'VENDOR') query.supplier = req.user._id;

    if (status) query.status = status;
    if (search) {
      // Search by order ID or related auction
      query.$or = [{ notes: { $regex: search, $options: 'i' } }];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('buyer', 'name email company')
      .populate('supplier', 'name email company')
      .populate('auction', 'title')
      .populate('requirement', 'title')
      .populate('winningBid', 'amount')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return ApiResponse.paginated(res, orders, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Create order (after winner selection)
exports.createOrder = async (req, res, next) => {
  try {
    const { auctionId } = req.body;

    const auction = await Auction.findById(auctionId).populate('requirement');
    if (!auction) return ApiResponse.notFound(res, 'Auction not found.');

    if (!auction.winner || !auction.winner.vendor) {
      return ApiResponse.badRequest(res, 'Winner must be selected before creating an order.');
    }

    // Check if order already exists
    const existingOrder = await Order.findOne({ auction: auctionId });
    if (existingOrder) {
      return ApiResponse.conflict(res, 'Order already exists for this auction.');
    }

    const requirement = await ProcurementRequirement.findById(auction.requirement);

    const order = await Order.create({
      auction: auction._id,
      requirement: auction.requirement._id || auction.requirement,
      buyer: auction.buyer,
      supplier: auction.winner.vendor,
      winningBid: auction.winner.bid,
      amount: auction.winner.amount,
      quantity: requirement?.quantity || 1,
      deliveryLocation: requirement?.deliveryLocation || 'TBD',
      deliveryDeadline: requirement?.deliveryDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'CREATED',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'ASSIGNED',
    });

    // Update auction status
    auction.status = 'ORDER_CREATED';
    await auction.save();

    // Create payment record
    const payment = await Payment.create({
      order: order._id,
      buyer: order.buyer,
      supplier: order.supplier,
      amount: order.amount,
      method: 'MOCK',
      status: 'PENDING',
    });

    // Notify supplier
    await NotificationService.create({
      recipient: order.supplier,
      type: 'VENDOR_ASSIGNED',
      title: 'New Order Assigned',
      message: `You have been assigned a new order for ₹${order.amount.toLocaleString()}.`,
      data: { entityType: 'ORDER', entityId: order._id, link: `/vendor/orders/${order._id}` },
    });

    // Notify buyer
    await NotificationService.create({
      recipient: order.buyer,
      type: 'ORDER_CREATED',
      title: 'Order Created',
      message: `Order created for auction "${auction.title}". Amount: ₹${order.amount.toLocaleString()}.`,
      data: { entityType: 'ORDER', entityId: order._id, link: `/buyer/orders/${order._id}` },
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: order._id,
      description: `Order created for auction "${auction.title}". Amount: ₹${order.amount.toLocaleString()}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    await order.populate('buyer', 'name email');
    await order.populate('supplier', 'name email');
    await order.populate('auction', 'title');

    return ApiResponse.created(res, { order, payment }, 'Order created successfully.');
  } catch (error) {
    next(error);
  }
};

// Get order by ID
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email company')
      .populate('supplier', 'name email company')
      .populate('auction', 'title startingPrice currentLowestBid')
      .populate('requirement', 'title description specifications')
      .populate('winningBid', 'amount submittedAt')
      .populate('approvedBy', 'name');

    if (!order) return ApiResponse.notFound(res, 'Order not found.');

    // Check access
    if (req.user.role === 'BUYER' && order.buyer._id.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }
    if (req.user.role === 'VENDOR' && order.supplier._id.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }

    return ApiResponse.success(res, order);
  } catch (error) {
    next(error);
  }
};

// Update order
exports.updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return ApiResponse.notFound(res, 'Order not found.');

    const { status, notes, trackingInfo } = req.body;

    if (status) order.status = status;
    if (notes) order.notes = notes;
    if (trackingInfo) order.trackingInfo = { ...order.trackingInfo, ...trackingInfo };

    await order.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'ORDER_UPDATED',
      entityType: 'ORDER',
      entityId: order._id,
      description: `Order updated. Status: ${order.status}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, order, 'Order updated.');
  } catch (error) {
    next(error);
  }
};

// Approve order
exports.approveOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return ApiResponse.notFound(res, 'Order not found.');

    if (!['CREATED', 'PENDING_APPROVAL'].includes(order.status)) {
      return ApiResponse.badRequest(res, 'Order is not pending approval.');
    }

    order.status = 'APPROVED';
    order.paymentStatus = 'PENDING';
    order.approvedBy = req.user._id;
    order.approvedAt = new Date();
    await order.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'ORDER_APPROVED',
      entityType: 'ORDER',
      entityId: order._id,
      description: `Order approved`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, order, 'Order approved.');
  } catch (error) {
    next(error);
  }
};

// Complete order
exports.completeOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return ApiResponse.notFound(res, 'Order not found.');

    order.status = 'COMPLETED';
    order.fulfillmentStatus = 'COMPLETED';
    await order.save();

    // Update auction status
    await Auction.findByIdAndUpdate(order.auction, { status: 'COMPLETED' });
    await ProcurementRequirement.findByIdAndUpdate(order.requirement, { status: 'COMPLETED' });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'ORDER_UPDATED',
      entityType: 'ORDER',
      entityId: order._id,
      description: `Order completed`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, order, 'Order completed.');
  } catch (error) {
    next(error);
  }
};

// Update fulfillment (supplier)
exports.updateFulfillment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return ApiResponse.notFound(res, 'Order not found.');

    if (req.user.role === 'VENDOR') {
      if (order.supplier.toString() !== req.user._id.toString()) {
        return ApiResponse.forbidden(res, 'Access denied.');
      }
    }

    const { fulfillmentStatus, trackingInfo } = req.body;

    const validTransitions = {
      ASSIGNED: ['ACCEPTED'],
      ACCEPTED: ['PROCESSING'],
      PROCESSING: ['READY_FOR_DELIVERY'],
      READY_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED: ['COMPLETED'],
    };

    if (fulfillmentStatus) {
      const allowed = validTransitions[order.fulfillmentStatus] || [];
      if (!allowed.includes(fulfillmentStatus) && req.user.role !== 'ADMIN') {
        return ApiResponse.badRequest(res, `Cannot transition from ${order.fulfillmentStatus} to ${fulfillmentStatus}.`);
      }
      order.fulfillmentStatus = fulfillmentStatus;

      if (fulfillmentStatus === 'DELIVERED') {
        order.status = 'DELIVERED';
      }
    }

    if (trackingInfo) {
      order.trackingInfo = { ...order.trackingInfo, ...trackingInfo };
    }

    await order.save();

    // Notify buyer of fulfillment update
    await NotificationService.create({
      recipient: order.buyer,
      type: 'FULFILLMENT_UPDATED',
      title: 'Fulfillment Update',
      message: `Order fulfillment status updated to ${order.fulfillmentStatus}.`,
      data: { entityType: 'ORDER', entityId: order._id },
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'FULFILLMENT_UPDATED',
      entityType: 'ORDER',
      entityId: order._id,
      description: `Fulfillment status updated to ${order.fulfillmentStatus}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, order, 'Fulfillment updated.');
  } catch (error) {
    next(error);
  }
};

// Supplier withdrawal request
exports.supplierWithdrawalRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return ApiResponse.badRequest(res, 'Reason is required.');

    const order = await Order.findById(req.params.id);
    if (!order) return ApiResponse.notFound(res, 'Order not found.');

    if (order.supplier.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }

    order.fulfillmentStatus = 'WITHDRAWAL_REQUESTED';
    order.withdrawalRequest = {
      reason,
      requestedAt: new Date(),
      status: 'PENDING',
    };
    await order.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'WITHDRAWAL_REQUESTED',
      entityType: 'ORDER',
      entityId: order._id,
      description: `Supplier withdrawal requested. Reason: ${reason}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, order, 'Withdrawal request submitted.');
  } catch (error) {
    next(error);
  }
};
