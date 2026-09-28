const express = require('express');
const router = express.Router();
const bc = require('../controllers/bidController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Bid routes under auctions
router.get('/auctions/:auctionId/bids', authenticate, bc.getAuctionBids);
router.post('/auctions/:auctionId/bids', authenticate, authorize('VENDOR'), bc.submitBid);

// Direct bid routes
router.get('/my', authenticate, bc.getMyBids);
router.get('/:id', authenticate, bc.getBidById);
router.post('/:id/withdraw-request', authenticate, authorize('VENDOR'), bc.withdrawBid);

module.exports = router;
