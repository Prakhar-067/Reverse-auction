const express = require('express');
const router = express.Router();
const cc = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', authenticate, cc.getCategories);
router.post('/', authenticate, authorize('ADMIN'), cc.createCategory);
router.patch('/:id', authenticate, authorize('ADMIN'), cc.updateCategory);

module.exports = router;
