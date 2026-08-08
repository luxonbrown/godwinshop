const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, notificationController.listMine);
router.get('/unread-count', requireAuth, notificationController.unreadCount);
router.put('/:id(\\d+)/read', requireAuth, notificationController.markRead);
router.put('/read-all', requireAuth, notificationController.markAllRead);
router.delete('/:id(\\d+)', requireAuth, notificationController.deleteNotification);

module.exports = router;