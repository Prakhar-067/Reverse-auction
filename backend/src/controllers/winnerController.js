const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Order = require('../models/Order');
const ProcurementRequirement = require('../models/ProcurementRequirement');
const Payment = require('../models/Payment');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const ApiResponse = require('../utils/ApiResponse');

// Select winner
exports.selectWinner = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const auction = await Auction.findById(auctionId);
    if (!auction) return ApiResponse.notFound(res, 'Auction not found.');

    if (auction.status !== 'CLOSED') {
      return ApiResponse.badRequest(res, 'Auction must be closed before selecting a winner.');
    }

    // Find lowest valid bid (tie-breaker: earliest submission)
    const lowestBid = await Bid.findOne({
      auction: auctionId,
      status: { $in: ['WINNING', 'VALID', 'OUTBID'] },
    }).sort({ amount: 1, submittedAt: 1 });

    if (!lowestBid) {
      return ApiResponse.badRequest(res, 'No valid bids found for this auction.');
    }

    // Mark winning bid
    await Bid.updateMany(
      { auction: auctionId, status: { $in: ['VALID', 'WINNING', 'OUTBID'] } },
      { status: 'OUTBID' }
    );
    lowestBid.status = 'WINNING';
    await lowestBid.save();

    // Update auction
    auction.status = 'WINNER_SELECTED';
    auction.winner = {
      vendor: lowestBid.vendor,
      bid: lowestBid._id,
      amount: lowestBid.amount,
      selectedAt: new Date(),
      selectedBy: req.user._id,
    };
    await auction.save();

    // Notify winner
    await NotificationService.create({
      recipient: lowestBid.vendor,
      type: 'AUCTION_WON',
      title: 'Congratulations! You Won!',
      message: `You won the auction "${auction.title}" with a bid of ₹${lowestBid.amount.toLocaleString()}.`,
      data: { entityType: 'AUCTION', entityId: auction._id },
    });

    // Notify other participants
    const otherBidders = await Bid.distinct('vendor', {
      auction: auctionId,
      vendor: { $ne: lowestBid.vendor },
    });
    for (const vendorId of otherBidders) {
      await NotificationService.create({
        recipient: vendorId,
        type: 'AUCTION_LOST',
        title: 'Auction Result',
        message: `Auction "${auction.title}" has been concluded. Unfortunately, you did not win.`,
        data: { entityType: 'AUCTION', entityId: auction._id },
      });
    }

    // Notify buyer
    await NotificationService.create({
      recipient: auction.buyer,
      type: 'WINNER_SELECTED',
      title: 'Winner Selected',
      message: `Winner selected for auction "${auction.title}". Winning bid: ₹${lowestBid.amount.toLocaleString()}.`,
      data: { entityType: 'AUCTION', entityId: auction._id },
    });

    // Emit socket event
    if (NotificationService.io) {
      NotificationService.io.to(`auction:${auctionId}`).emit('auction:winnerSelected', {
        auctionId,
        winnerAmount: lowestBid.amount,
      });
    }

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'WINNER_SELECTED',
      entityType: 'AUCTION',
      entityId: auction._id,
      description: `Winner selected for auction "${auction.title}". Bid: ₹${lowestBid.amount.toLocaleString()}`,
      newValue: { winnerId: lowestBid.vendor, amount: lowestBid.amount },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, {
      auction,
      winningBid: lowestBid,
    }, 'Winner selected successfully.');
  } catch (error) {
    next(error);
  }
};

// Get winner
exports.getWinner = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.auctionId)
      .populate('winner.vendor', 'name email company')
      .populate('winner.bid');

    if (!auction) return ApiResponse.notFound(res, 'Auction not found.');
    if (!auction.winner || !auction.winner.vendor) {
      return ApiResponse.notFound(res, 'Winner not yet selected.');
    }

    return ApiResponse.success(res, auction.winner);
  } catch (error) {
    next(error);
  }
};
