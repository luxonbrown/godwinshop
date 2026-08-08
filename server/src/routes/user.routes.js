const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { handleValidation } = require('../middleware/validate');

router.get('/profile', requireAuth, userController.getProfile);

router.put(
  '/profile',
  requireAuth,
  upload.fields([{ name: 'profileImage', maxCount: 1 }]),
  body('full_name').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Full name must be at least 2 characters'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }).withMessage('Phone number is too long'),
  body('address').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Address is too long'),
  body('city').optional({ values: 'falsy' }).trim().isLength({ max: 120 }).withMessage('City is too long'),
  handleValidation,
  userController.updateProfile
);

module.exports = router;