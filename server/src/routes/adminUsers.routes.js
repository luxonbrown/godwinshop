const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, userController.listUsers);
router.put('/:id/status', requireAdmin, userController.toggleUserStatus);

module.exports = router;