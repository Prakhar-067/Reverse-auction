const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const ApiResponse = require('../utils/ApiResponse');

// Get bids for an auction
exports.getAuctionBids = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const auction = await Auction.findById(auctionId);
    if (!auction) return ApiResponse.notFound(res, 'Auction not found.');

    let query = { auction: auctionId, status: { $in: ['VALID', 'WINNING', 'OUTBID'] } };

    // Vendors can only see their own bids' vendor info
    const total = await Bid.countDocuments(query);
    let bids = await Bid.find(query)
      .sort({ amount: 1, submittedAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // For privacy: if vendor, mask other vendors' information
    if (req.user.role === 'VENDOR') {
      bids = bids.map((bid, index) => {
        const b = bid.toObject();
        if (b.vendor.toString() !== req.user._id.toString()) {
          b.vendor = null;
          b.vendorName = `Vendor ${index + 1}`;
        } else {
          b.isOwnBid = true;
        }
        return b;
      });
    } else {
      // For authorized users, populate vendor info
      bids = await Bid.find(query)
        .populate('vendor', 'name email company')
        .sort({ amount: 1, submittedAt: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    }

    return ApiResponse.paginated(res, bids, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Submit a bid - CRITICAL BUSINESS LOGIC
exports.submitBid = async (req, res, next) => {

  try {
    const { auctionId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return ApiResponse.badRequest(res, 'Valid bid amount is required.');
    }

    // Fetch auction with session for consistency
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return ApiResponse.notFound(res, 'Auction not found.');
    }

    // Verify auction is OPEN
    if (auction.status !== 'OPEN') {
      return ApiResponse.badRequest(res, 'Auction is not open for bidding.', 'AUCTION_NOT_OPEN');
    }

    // Verify auction hasn't ended (server-side time check)
    if (new Date() >= new Date(auction.endTime)) {
      auction.status = 'CLOSED';
      await auction.save();
      return ApiResponse.badRequest(res, 'Auction has ended. No more bids accepted.', 'AUCTION_ENDED');
    }

    // Verify vendor is eligible
    if (req.user.role !== 'VENDOR') {
      return ApiResponse.forbidden(res, 'Only vendors can submit bids.');
    }

    // Check if vendor has joined auction
    const isParticipant = auction.participants.some(p => p.vendor.toString() === req.user._id.toString());
    if (!isParticipant) {
      // Auto-join
      auction.participants.push({ vendor: req.user._id, joinedAt: new Date() });
    }

    // CRITICAL: Validate bid amount against current lowest
    const currentLowest = auction.currentLowestBid || auction.startingPrice;

    if (amount >= currentLowest) {

      // Log rejected bid
      await AuditService.log({
        actor: req.user._id,
        actorName: req.user.name,
        role: req.user.role,
        action: 'BID_REJECTED',
        entityType: 'BID',
        entityId: auction._id,
        description: `Bid of ₹${amount.toLocaleString()} rejected. Must be lower than current lowest ₹${currentLowest.toLocaleString()}.`,
        metadata: { amount, currentLowest },
      });

      return ApiResponse.badRequest(res,
        `Your bid must be lower than the current lowest bid of ₹${currentLowest.toLocaleString()}.`,
        'INVALID_BID'
      );
    }

    // Validate minimum decrement
    if (auction.minimumBidDecrement > 0) {
      const decrement = currentLowest - amount;
      if (decrement < auction.minimumBidDecrement) {
        return ApiResponse.badRequest(res,
          `Bid must be at least ₹${auction.minimumBidDecrement.toLocaleString()} less than the current lowest bid. Your decrement: ₹${decrement.toLocaleString()}.`,
          'INSUFFICIENT_DECREMENT'
        );
      }
    }

    // Bid amount cannot be negative or zero
    if (amount <= 0) {
      return ApiResponse.badRequest(res, 'Bid amount must be positive.');
    }

    // Mark previous bids from any vendor as OUTBID
    await Bid.updateMany(
      { auction: auctionId, status: { $in: ['VALID', 'WINNING'] } },
      { status: 'OUTBID' }
    );

    // Create the bid
    const bid = await Bid.create({
      auction: auctionId,
      vendor: req.user._id,
      amount,
      status: 'WINNING',
      isBinding: true,
      submittedAt: new Date(),
      validationResult: { isValid: true, message: 'Bid accepted' },
    });

    // Update auction's current lowest bid atomically
    auction.currentLowestBid = amount;
    auction.totalBids = (auction.totalBids || 0) + 1;
    await auction.save();

    // Emit real-time update
    if (NotificationService.io) {
      NotificationService.io.to(`auction:${auctionId}`).emit('bid:accepted', {
        auctionId,
        currentLowestBid: amount,
        totalBids: auction.totalBids,
        message: 'New lowest bid submitted!',
      });
    }

    // Notify other participants they've been outbid
    const otherParticipants = auction.participants.filter(
      p => p.vendor.toString() !== req.user._id.toString()
    );
    for (const participant of otherParticipants) {
      await NotificationService.create({
        recipient: participant.vendor,
        type: 'OUTBID',
        title: 'You have been outbid!',
        message: `A new lower bid of ₹${amount.toLocaleString()} has been submitted in auction "${auction.title}".`,
        data: { entityType: 'AUCTION', entityId: auction._id, link: `/vendor/auctions/${auction._id}/bid` },
      });
    }

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'BID_SUBMITTED',
      entityId: bid._id,
      description: `Bid of ₹${amount.toLocaleString()} submitted for auction "${auction.title}"`,
      newValue: { amount, auctionId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.created(res, bid, 'Bid submitted successfully.');
  } catch (error) {
    next(error);
  }
};

// Get vendor's own bids
exports.getMyBids = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, auctionId, status } = req.query;
    const query = { vendor: req.user._id };
    if (auctionId) query.auction = auctionId;
    if (status) query.status = status;

    const total = await Bid.countDocuments(query);
    const bids = await Bid.find(query)
      .populate('auction', 'title status currentLowestBid startingPrice endTime')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return ApiResponse.paginated(res, bids, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Get bid by ID
exports.getBidById = async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.id)
      .populate('auction', 'title status')
      .populate('vendor', 'name email company');

    if (!bid) return ApiResponse.notFound(res, 'Bid not found.');

    // Vendors can only view own bids
    if (req.user.role === 'VENDOR' && bid.vendor._id.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }

    return ApiResponse.success(res, bid);
  } catch (error) {
    next(error);
  }
};

// Request bid withdrawal
exports.withdrawBid = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return ApiResponse.badRequest(res, 'Withdrawal reason is required.');

    const bid = await Bid.findById(req.params.id);
    if (!bid) return ApiResponse.notFound(res, 'Bid not found.');

    if (bid.vendor.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }

    if (!['VALID', 'WINNING', 'OUTBID'].includes(bid.status)) {
      return ApiResponse.badRequest(res, 'This bid cannot be withdrawn.');
    }

    bid.status = 'WITHDRAWAL_PENDING';
    await bid.save();

    await WithdrawalRequest.create({
      entityType: 'BID',
      entityId: bid._id,
      requestedBy: req.user._id,
      reason,
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'BID_WITHDRAWAL_REQUESTED',
      entityType: 'BID',
      entityId: bid._id,
      description: `Withdrawal requested for bid ₹${bid.amount.toLocaleString()}. Reason: ${reason}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, bid, 'Withdrawal request submitted.');
  } catch (error) {
    next(error);
  }
};
