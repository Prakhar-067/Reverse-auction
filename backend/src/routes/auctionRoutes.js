const express = require('express');
const router = express.Router();
const ac = require('../controllers/auctionController');
const wc = require('../controllers/winnerController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', authenticate, ac.getAuctions);
router.post('/', authenticate, authorize('BUYER', 'PROCUREMENT_OFFICER', 'ADMIN'), ac.createAuction);
router.get('/:id', authenticate, ac.getAuctionById);
router.patch('/:id', authenticate, authorize('BUYER', 'ADMIN'), ac.updateAuction);
router.post('/:id/publish', authenticate, authorize('PROCUREMENT_OFFICER', 'ADMIN'), ac.publishAuction);
router.post('/:id/start', authenticate, authorize('PROCUREMENT_OFFICER', 'ADMIN'), ac.startAuction);
router.post('/:id/close', authenticate, authorize('PROCUREMENT_OFFICER', 'ADMIN', 'BUYER'), ac.closeAuction);
router.post('/:id/cancel', authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER'), ac.cancelAuction);
router.get('/:id/stats', authenticate, ac.getAuctionStats);

// Winner routes
router.post('/:auctionId/select-winner', authenticate, authorize('BUYER', 'PROCUREMENT_OFFICER', 'ADMIN'), wc.selectWinner);
router.get('/:auctionId/winner', authenticate, wc.getWinner);

module.exports = router;
