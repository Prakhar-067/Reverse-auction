const express = require('express');
const router = express.Router();
const ac = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', authenticate, authorize('ADMIN', 'AUCTION_AUDITOR'), ac.getAuditLogs);
router.get('/:id', authenticate, authorize('ADMIN', 'AUCTION_AUDITOR'), ac.getAuditLogById);

module.exports = router;
