const Auction = require('../models/Auction');
const NotificationService = require('../services/notificationService');
const AuditService = require('../services/auditService');

/**
 * Check and close auctions that have reached their end time.
 * This runs periodically to ensure auctions close even without manual intervention.
 */
const checkAuctionTimers = async () => {
  try {
    const now = new Date();

    // Find open auctions that have passed their end time
    const expiredAuctions = await Auction.find({
      status: 'OPEN',
      endTime: { $lte: now },
    });

    for (const auction of expiredAuctions) {
      auction.status = 'CLOSED';
      await auction.save();

      console.log(`Auction "${auction.title}" auto-closed at ${now.toISOString()}`);

      // Emit socket event
      if (NotificationService.io) {
        NotificationService.io.to(`auction:${auction._id}`).emit('auction:closed', {
          auctionId: auction._id,
          message: 'Auction has been automatically closed.',
        });
      }

      // Notify participants
      for (const p of auction.participants) {
        await NotificationService.create({
          recipient: p.vendor,
          type: 'AUCTION_CLOSED',
          title: 'Auction Closed',
          message: `Auction "${auction.title}" has been closed.`,
          data: { entityType: 'AUCTION', entityId: auction._id },
        });
      }

      // Notify buyer
      await NotificationService.create({
        recipient: auction.buyer,
        type: 'AUCTION_CLOSED',
        title: 'Auction Closed',
        message: `Your auction "${auction.title}" has been closed. Please review bids and select a winner.`,
        data: { entityType: 'AUCTION', entityId: auction._id },
      });

      await AuditService.log({
        actorName: 'System',
        role: 'SYSTEM',
        action: 'AUCTION_CLOSED',
        entityType: 'AUCTION',
        entityId: auction._id,
        description: `Auction "${auction.title}" auto-closed by system timer`,
      });
    }

    // Auto-start published auctions that have reached start time
    const readyAuctions = await Auction.find({
      status: 'PUBLISHED',
      startTime: { $lte: now },
    });

    for (const auction of readyAuctions) {
      auction.status = 'OPEN';
      await auction.save();

      console.log(`Auction "${auction.title}" auto-started at ${now.toISOString()}`);

      if (NotificationService.io) {
        NotificationService.io.to(`auction:${auction._id}`).emit('auction:started', {
          auctionId: auction._id,
          message: 'Auction has started!',
        });
      }

      await AuditService.log({
        actorName: 'System',
        role: 'SYSTEM',
        action: 'AUCTION_STARTED',
        entityType: 'AUCTION',
        entityId: auction._id,
        description: `Auction "${auction.title}" auto-started by system timer`,
      });
    }

    // Emit "ending soon" for auctions ending within 5 minutes
    const endingSoonThreshold = new Date(now.getTime() + 5 * 60 * 1000);
    const endingSoonAuctions = await Auction.find({
      status: 'OPEN',
      endTime: { $gt: now, $lte: endingSoonThreshold },
    });

    for (const auction of endingSoonAuctions) {
      if (NotificationService.io) {
        NotificationService.io.to(`auction:${auction._id}`).emit('auction:endingSoon', {
          auctionId: auction._id,
          endTime: auction.endTime,
          message: 'Auction ending soon!',
        });
      }
    }

  } catch (error) {
    console.error('Auction timer check error:', error.message);
  }
};

// Start the auction timer job (runs every 10 seconds)
const startAuctionTimerJob = () => {
  console.log('Auction timer job started (10s interval)');
  setInterval(checkAuctionTimers, 10000);
};

module.exports = { startAuctionTimerJob, checkAuctionTimers };
