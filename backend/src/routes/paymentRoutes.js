const express = require('express');
const router = express.Router();
const pc = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', authenticate, authorize('FINANCE_OFFICER', 'ADMIN', 'AUCTION_AUDITOR'), pc.getPayments);
router.get('/:id', authenticate, authorize('FINANCE_OFFICER', 'ADMIN', 'AUCTION_AUDITOR', 'BUYER', 'VENDOR'), pc.getPaymentById);
router.post('/:id/process', authenticate, authorize('FINANCE_OFFICER', 'ADMIN'), pc.processPayment);
router.post('/:id/mock-success', authenticate, authorize('FINANCE_OFFICER', 'ADMIN'), pc.mockPaymentSuccess);
router.post('/:id/mock-failure', authenticate, authorize('FINANCE_OFFICER', 'ADMIN'), pc.mockPaymentFailure);

module.exports = router;
