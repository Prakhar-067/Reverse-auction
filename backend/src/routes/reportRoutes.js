const express = require('express');
const router = express.Router();
const rc = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const allowedRoles = ['ADMIN', 'PROCUREMENT_OFFICER', 'FINANCE_OFFICER', 'AUCTION_AUDITOR', 'BUYER'];

router.get('/dashboard', authenticate, authorize(...allowedRoles), rc.getDashboard);
router.get('/auctions', authenticate, authorize(...allowedRoles), rc.getAuctionReport);
router.get('/bids', authenticate, authorize(...allowedRoles), rc.getBidReport);
router.get('/finance', authenticate, authorize(...allowedRoles), rc.getFinanceReport);
router.get('/procurement', authenticate, authorize(...allowedRoles), rc.getProcurementReport);

module.exports = router;
