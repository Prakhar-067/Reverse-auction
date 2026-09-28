const express = require('express');
const router = express.Router();
const oc = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', authenticate, oc.getOrders);
router.post('/', authenticate, authorize('BUYER', 'PROCUREMENT_OFFICER', 'ADMIN'), oc.createOrder);
router.get('/:id', authenticate, oc.getOrderById);
router.patch('/:id', authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER'), oc.updateOrder);
router.post('/:id/approve', authenticate, authorize('PROCUREMENT_OFFICER', 'ADMIN'), oc.approveOrder);
router.post('/:id/complete', authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER', 'BUYER'), oc.completeOrder);
router.post('/:id/fulfillment', authenticate, authorize('VENDOR', 'ADMIN'), oc.updateFulfillment);
router.post('/:id/withdrawal-request', authenticate, authorize('VENDOR'), oc.supplierWithdrawalRequest);

module.exports = router;
