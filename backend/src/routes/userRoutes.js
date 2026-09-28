const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', authenticate, authorize('ADMIN'), userController.getUsers);
router.get('/:id', authenticate, userController.getUserById);
router.post('/', authenticate, authorize('ADMIN'), userController.createUser);
router.patch('/:id', authenticate, userController.updateUser);
router.patch('/:id/status', authenticate, authorize('ADMIN'), userController.updateUserStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), userController.deleteUser);

module.exports = router;
