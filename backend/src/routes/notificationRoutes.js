const express = require('express');
const router = express.Router();
const nc = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, nc.getNotifications);
router.patch('/:id/read', authenticate, nc.markAsRead);
router.patch('/read-all', authenticate, nc.markAllAsRead);

module.exports = router;
