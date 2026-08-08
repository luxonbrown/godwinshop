const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const contactController = require('../controllers/contactController');
const { handleValidation } = require('../middleware/validate');

router.post(
  '/contact',
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('subject').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  body('message').trim().isLength({ min: 5, max: 5000 }).withMessage('Message must be at least 5 characters'),
  handleValidation,
  contactController.submitContactMessage
);

module.exports = router;