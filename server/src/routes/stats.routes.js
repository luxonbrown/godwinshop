const express = require('express');
const router = express.Router();

const statsController = require('../controllers/statsController');
const { requireAdmin } = require('../middleware/auth');

router.get('/dashboard', requireAdmin, statsController.getStats);

module.exports = router;