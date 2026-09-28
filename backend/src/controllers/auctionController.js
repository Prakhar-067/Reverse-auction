const Auction = require('../models/Auction');
const ProcurementRequirement = require('../models/ProcurementRequirement');
const Bid = require('../models/Bid');
const User = require('../models/User');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const ApiResponse = require('../utils/ApiResponse');

// Get auctions
exports.getAuctions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, search, visibility, myAuctions } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Role-based filtering
    if (req.user.role === 'BUYER') {
      if (myAuctions === 'true') query.buyer = req.user._id;
    } else if (req.user.role === 'VENDOR') {
      query.status = { $in: ['PUBLISHED', 'OPEN', 'CLOSED', 'WINNER_SELECTED', 'COMPLETED'] };
      query.visibility = 'PUBLIC';
    } else if (req.user.role === 'GUEST') {
      query.visibility = 'PUBLIC';
      query.status = { $in: ['PUBLISHED', 'OPEN', 'CLOSED'] };
    }

    if (visibility) query.visibility = visibility;

    const total = await Auction.countDocuments(query);
    const auctions = await Auction.find(query)
      .populate('buyer', 'name email company')
      .populate('category', 'name')
      .populate('requirement', 'title')
      .populate('winner.vendor', 'name company')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return ApiResponse.paginated(res, auctions, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Create auction
exports.createAuction = async (req, res, next) => {
  try {
    const { requirementId, title, description, startingPrice, minimumBidDecrement,
            startTime, endTime, visibility, eligibilityRequirements } = req.body;

    // Verify requirement exists and is approved
    const requirement = await ProcurementRequirement.findById(requirementId);
    if (!requirement) return ApiResponse.notFound(res, 'Requirement not found.');

    if (req.user.role === 'BUYER' && requirement.buyer.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }

    if (!['APPROVED'].includes(requirement.status)) {
      return ApiResponse.badRequest(res, 'Requirement must be approved before creating an auction.');
    }

    const auction = await Auction.create({
      requirement: requirement._id,
      buyer: requirement.buyer,
      title: title || requirement.title,
      description: description || requirement.description,
      category: requirement.category,
      startingPrice: startingPrice || requirement.estimatedBudget,
      minimumBidDecrement: minimumBidDecrement || requirement.minimumBidDecrement || 0,
      startTime: startTime || requirement.auctionStartDate,
      endTime: endTime || requirement.auctionEndDate,
      visibility: visibility || (requirement.isPublic ? 'PUBLIC' : 'PRIVATE'),
      eligibilityRequirements: eligibilityRequirements || requirement.eligibilityRequirements,
      status: 'DRAFT',
      createdBy: req.user._id,
    });

    await auction.populate('buyer', 'name email');
    await auction.populate('category', 'name');

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'AUCTION_CREATED',
      entityType: 'AUCTION',
      entityId: auction._id,
      description: `Auction "${auction.title}" created`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.created(res, auction, 'Auction created successfully.');
  } catch (error) {
    next(error);
  }
};

// Get auction by ID
exports.getAuctionById = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('buyer', 'name email company')
      .populate('category', 'name')
      .populate('requirement')
      .populate('winner.vendor', 'name email company')
      .populate('winner.bid')
      .populate('participants.vendor', 'name company')
      .populate('createdBy', 'name');

    if (!auction) return ApiResponse.notFound(res, 'Auction not found.');

    // Add bid count
    const bidCount = await Bid.countDocuments({ auction: auction._id, status: { $in: ['VALID', 'WINNING', 'OUTBID'] } });
    const auctionObj = auction.toObject();
    auctionObj.totalBids = bidCount;

    return ApiResponse.success(res, auctionObj);
  } catch (error) {
    next(error);
  }
};

// Update auction
exports.updateAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return ApiResponse.notFound(res, 'Auction not found.');

    if (req.user.role === 'BUYER' && auction.buyer.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }

    if (!['DRAFT', 'PENDING_APPROVAL'].includes(auction.status)) {
      return ApiResponse.badRequest(res, `Cannot edit auction in ${auction.status} status.`);
    }

    const allowedFields = ['title', 'description', 'startingPrice', 'minimumBidDecrement',
      'startTime', 'endTime', 'visibility', 'eligibilityRequirements'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) auction[field] = req.body[field];
    });

    await auction.save();
    await auction.populate('buyer', 'name email');

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'AUCTION_UPDATED',
      entityType: 'AUCTION',
      entityId: auction._id,
      description: `Auction "${auction.title}" updated`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, auction, 'Auction updated successfully.');
  } catch (error) {
    next(error);
  }
};

// Publish auction
exports.publishAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return ApiResponse.notFound(res, 'Auction not found.');

    if (!['DRAFT', 'APPROVED'].includes(auction.status)) {
      return ApiResponse.badRequest(res, `Cannot publish auction in ${auction.status} status.`);
    }

    auction.status = 'PUBLISHED';
    await auction.save();

    // Update requirement status
    await ProcurementRequirement.findByIdAndUpdate(auction.requirement, { status: 'PUBLISHED' });

    // Notify vendors
    const vendors = await User.find({ role: 'VENDOR', status: 'ACTIVE' });
    for (const vendor of vendors) {
      await NotificationService.create({
        recipient: vendor._id,
        type: 'AUCTION_PUBLISHED',
        title: 'New Auction Available',
        message: `A new auction "${auction.title}" has been published. Starting price: ₹${auction.startingPrice.toLocaleString()}.`,
        data: { entityType: 'AUCTION', entityId: auction._id, link: `/vendor/auctions/${auction._id}` },
      });
    }

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'AUCTION_PUBLISHED',
      entityType: 'AUCTION',
      entityId: auction._id,
      description: `Auction "${auction.title}" published`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, auction, 'Auction published successfully.');
  } catch (error) {
    next(error);
  }
};

// Start auction
exports.startAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return ApiResponse.notFound(res, 'Auction not found.');

    if (auction.status !== 'PUBLISHED') {
      return ApiResponse.badRequest(res, `Cannot start auction in ${auction.status} status.`);
    }

    auction.status = 'OPEN';
    await auction.save();

    // Notify participants
    if (NotificationService.io) {
      NotificationService.io.to(`auction:${auction._id}`).emit('auction:started', {
        auctionId: auction._id,
        message: 'Auction has started!',
      });
    }

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'AUCTION_STARTED',
      entityType: 'AUCTION',
      entityId: auction._id,
      description: `Auction "${auction.title}" started`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, auction, 'Auction started.');
  } catch (error) {
    next(error);
  }
};

// Close auction
exports.closeAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return ApiResponse.notFound(res, 'Auction not found.');

    if (auction.status !== 'OPEN') {
      return ApiResponse.badRequest(res, `Cannot close auction in ${auction.status} status.`);
    }

    auction.status = 'CLOSED';
    await auction.save();

    // Notify participants
    if (NotificationService.io) {
      NotificationService.io.to(`auction:${auction._id}`).emit('auction:closed', {
        auctionId: auction._id,
        message: 'Auction has been closed.',
      });
    }

    // Notify all participants
    for (const p of auction.participants) {
      await NotificationService.create({
        recipient: p.vendor,
        type: 'AUCTION_CLOSED',
        title: 'Auction Closed',
        message: `Auction "${auction.title}" has been closed. Results will be announced soon.`,
        data: { entityType: 'AUCTION', entityId: auction._id },
      });
    }

    await AuditService.log({
      actor: req.user?._id || null,
      actorName: req.user?.name || 'System',
      role: req.user?.role || 'SYSTEM',
      action: 'AUCTION_CLOSED',
      entityType: 'AUCTION',
      entityId: auction._id,
      description: `Auction "${auction.title}" closed`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, auction, 'Auction closed.');
  } catch (error) {
    next(error);
  }
};

// Cancel auction
exports.cancelAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return ApiResponse.notFound(res, 'Auction not found.');

    if (['COMPLETED', 'CANCELLED'].includes(auction.status)) {
      return ApiResponse.badRequest(res, 'Cannot cancel a completed or already cancelled auction.');
    }

    const oldStatus = auction.status;
    auction.status = 'CANCELLED';
    await auction.save();

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'AUCTION_CANCELLED',
      entityType: 'AUCTION',
      entityId: auction._id,
      description: `Auction "${auction.title}" cancelled (was ${oldStatus})`,
      oldValue: { status: oldStatus },
      newValue: { status: 'CANCELLED' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, auction, 'Auction cancelled.');
  } catch (error) {
    next(error);
  }
};

// Get auction stats
exports.getAuctionStats = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return ApiResponse.notFound(res, 'Auction not found.');

    const totalBids = await Bid.countDocuments({ auction: auction._id });
    const validBids = await Bid.countDocuments({ auction: auction._id, status: { $in: ['VALID', 'WINNING', 'OUTBID'] } });
    const uniqueVendors = await Bid.distinct('vendor', { auction: auction._id });
    const lowestBid = await Bid.findOne({ auction: auction._id, status: { $in: ['VALID', 'WINNING'] } }).sort({ amount: 1 });

    const savings = lowestBid ? auction.startingPrice - lowestBid.amount : 0;
    const savingsPercent = lowestBid ? ((savings / auction.startingPrice) * 100).toFixed(2) : 0;

    return ApiResponse.success(res, {
      totalBids,
      validBids,
      uniqueVendors: uniqueVendors.length,
      participants: auction.participants.length,
      lowestBid: lowestBid?.amount || null,
      startingPrice: auction.startingPrice,
      savings,
      savingsPercent,
    });
  } catch (error) {
    next(error);
  }
};
