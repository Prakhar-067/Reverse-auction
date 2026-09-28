const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const ProcurementRequirement = require('../models/ProcurementRequirement');
const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/ApiResponse');

// Dashboard report
exports.getDashboard = async (req, res, next) => {
  try {
    const isBuyer = req.user.role === 'BUYER';
    const buyerAuctionFilter = isBuyer ? { buyer: req.user._id } : {};
    const buyerOrderFilter = isBuyer ? { buyer: req.user._id } : {};
    const buyerReqFilter = isBuyer ? { buyer: req.user._id } : {};

    const [
      totalUsers,
      totalAuctions,
      activeAuctions,
      closedAuctions,
      completedAuctions,
      totalOrders,
      totalBids,
      pendingRequirements,
      totalVendors,
      pendingPayments,
      paidPayments,
    ] = await Promise.all([
      User.countDocuments({ status: 'ACTIVE' }),
      Auction.countDocuments(buyerAuctionFilter),
      Auction.countDocuments({ ...buyerAuctionFilter, status: { $in: ['OPEN', 'PUBLISHED'] } }),
      Auction.countDocuments({ ...buyerAuctionFilter, status: 'CLOSED' }),
      Auction.countDocuments({ ...buyerAuctionFilter, status: 'COMPLETED' }),
      Order.countDocuments(buyerOrderFilter),
      Bid.countDocuments(),
      ProcurementRequirement.countDocuments({ ...buyerReqFilter, status: 'PENDING_REVIEW' }),
      User.countDocuments({ role: 'VENDOR', status: 'ACTIVE' }),
      Payment.countDocuments({ status: 'PENDING' }),
      Payment.countDocuments({ status: 'PAID' }),
    ]);

    // Calculate total procurement value
    const orderMatch = isBuyer
      ? { buyer: req.user._id, status: { $nin: ['CANCELLED'] } }
      : { status: { $nin: ['CANCELLED'] } };

    const totalProcurementValue = await Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Calculate total paid value
    const totalPaidValue = await Payment.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Get recent auctions
    const recentAuctions = await Auction.find(buyerAuctionFilter)
      .populate('buyer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Auctions over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const auctionsOverTime = await Auction.aggregate([
      { $match: { ...buyerAuctionFilter, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Bids per auction
    const bidActivity = await Bid.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return ApiResponse.success(res, {
      cards: {
        totalUsers,
        totalAuctions,
        activeAuctions,
        closedAuctions,
        completedAuctions,
        totalOrders,
        totalBids,
        pendingRequirements,
        totalVendors,
        pendingPayments,
        paidPayments,
        totalProcurementValue: totalProcurementValue[0]?.total || 0,
        totalPaidValue: totalPaidValue[0]?.total || 0,
      },
      recentAuctions,
      charts: {
        auctionsOverTime,
        bidActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Auction report
exports.getAuctionReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const query = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
    if (req.user.role === 'BUYER') {
      query.buyer = req.user._id;
    }

    const [total, open, closed, cancelled, completed, winnerSelected] = await Promise.all([
      Auction.countDocuments(query),
      Auction.countDocuments({ ...query, status: { $in: ['OPEN', 'PUBLISHED'] } }),
      Auction.countDocuments({ ...query, status: 'CLOSED' }),
      Auction.countDocuments({ ...query, status: 'CANCELLED' }),
      Auction.countDocuments({ ...query, status: 'COMPLETED' }),
      Auction.countDocuments({ ...query, status: 'WINNER_SELECTED' }),
    ]);

    // Category distribution
    const categoryDistribution = await Auction.aggregate([
      { $match: query },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$cat.name', count: { $sum: 1 } } },
    ]);

    return ApiResponse.success(res, {
      total, open, closed, cancelled, completed, winnerSelected,
      categoryDistribution,
    });
  } catch (error) {
    next(error);
  }
};

// Bid report
exports.getBidReport = async (req, res, next) => {
  try {
    let bidQuery = {};
    if (req.user.role === 'BUYER') {
      const buyerAuctions = await Auction.find({ buyer: req.user._id }).select('_id');
      const auctionIds = buyerAuctions.map((a) => a._id);
      bidQuery.auction = { $in: auctionIds };
    }

    const totalBids = await Bid.countDocuments(bidQuery);
    const validBids = await Bid.countDocuments({ ...bidQuery, status: { $in: ['VALID', 'WINNING', 'OUTBID'] } });
    const winningBids = await Bid.countDocuments({ ...bidQuery, status: 'WINNING' });
    const uniqueVendors = await Bid.distinct('vendor', bidQuery);

    const avgBidsPerAuction = await Bid.aggregate([
      { $match: bidQuery },
      { $group: { _id: '$auction', count: { $sum: 1 } } },
      { $group: { _id: null, avg: { $avg: '$count' } } },
    ]);

    return ApiResponse.success(res, {
      totalBids,
      validBids,
      winningBids,
      vendorParticipation: uniqueVendors.length,
      avgBidsPerAuction: avgBidsPerAuction[0]?.avg?.toFixed(1) || 0,
    });
  } catch (error) {
    next(error);
  }
};

// Finance report
exports.getFinanceReport = async (req, res, next) => {
  try {
    let paymentQuery = {};
    if (req.user.role === 'BUYER') {
      const buyerOrders = await Order.find({ buyer: req.user._id }).select('_id');
      const orderIds = buyerOrders.map((o) => o._id);
      paymentQuery.order = { $in: orderIds };
    }

    const [pending, processing, paid, failed, refunded] = await Promise.all([
      Payment.countDocuments({ ...paymentQuery, status: 'PENDING' }),
      Payment.countDocuments({ ...paymentQuery, status: 'PROCESSING' }),
      Payment.countDocuments({ ...paymentQuery, status: 'PAID' }),
      Payment.countDocuments({ ...paymentQuery, status: 'FAILED' }),
      Payment.countDocuments({ ...paymentQuery, status: 'REFUNDED' }),
    ]);

    const totalAmount = await Payment.aggregate([
      { $match: paymentQuery },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    return ApiResponse.success(res, {
      pending, processing, paid, failed, refunded,
      totalAmount,
    });
  } catch (error) {
    next(error);
  }
};

// Procurement report
exports.getProcurementReport = async (req, res, next) => {
  try {
    const query = { 'winner.amount': { $exists: true } };
    if (req.user.role === 'BUYER') {
      query.buyer = req.user._id;
    }

    const auctions = await Auction.find(query).populate('requirement', 'estimatedBudget');

    let totalEstimatedBudget = 0;
    let totalWinningValue = 0;
    const savingsData = [];

    for (const auction of auctions) {
      const estimated = auction.requirement?.estimatedBudget || auction.startingPrice;
      const winning = auction.winner?.amount || 0;
      totalEstimatedBudget += estimated;
      totalWinningValue += winning;
      savingsData.push({
        title: auction.title,
        estimated,
        winning,
        savings: estimated - winning,
        savingsPercent: estimated > 0 ? (((estimated - winning) / estimated) * 100).toFixed(1) : '0',
      });
    }

    return ApiResponse.success(res, {
      totalEstimatedBudget,
      totalWinningValue,
      potentialSavings: totalEstimatedBudget - totalWinningValue,
      savingsPercent: totalEstimatedBudget > 0
        ? (((totalEstimatedBudget - totalWinningValue) / totalEstimatedBudget) * 100).toFixed(1)
        : 0,
      savingsData,
    });
  } catch (error) {
    next(error);
  }
};
