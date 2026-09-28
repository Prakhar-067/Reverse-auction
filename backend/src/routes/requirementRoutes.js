const express = require('express');
const router = express.Router();
const rc = require('../controllers/requirementController');
const { authenticate } = require('../middleware/auth');
const { authorize, hasPermission } = require('../middleware/rbac');

router.get('/', authenticate, rc.getRequirements);
router.post('/', authenticate, authorize('BUYER', 'ADMIN'), rc.createRequirement);
router.get('/:id', authenticate, rc.getRequirementById);
router.patch('/:id', authenticate, authorize('BUYER', 'ADMIN'), rc.updateRequirement);
router.post('/:id/submit', authenticate, authorize('BUYER', 'ADMIN'), rc.submitRequirement);
router.post('/:id/approve', authenticate, authorize('PROCUREMENT_OFFICER', 'ADMIN'), rc.approveRequirement);
router.post('/:id/reject', authenticate, authorize('PROCUREMENT_OFFICER', 'ADMIN'), rc.rejectRequirement);
router.post('/:id/request-revision', authenticate, authorize('PROCUREMENT_OFFICER', 'ADMIN'), rc.requestRevision);

module.exports = router;
