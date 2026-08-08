const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const auth = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');

const emailChain = () => body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail();

router.post(
  '/register',
  body('full_name').trim().isLength({ min: 2, max: 120 }).withMessage('Full name must be at least 2 characters'),
  emailChain(),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }).withMessage('Phone number is too long'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  handleValidation,
  auth.register
);

router.post('/login',
  emailChain(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
  auth.login
);

router.post('/verify',
  body('token').trim().isLength({ min: 16 }).withMessage('Verification token is required'),
  handleValidation,
  auth.verify
);

router.post('/resend-verification',
  emailChain(),
  handleValidation,
  auth.resendVerification
);

router.get('/session', auth.session);
router.get('/me', requireAuth, auth.me);

router.post('/logout', (req, res) => auth.logout(req, res));

router.put(
  '/password',
  requireAuth,
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  handleValidation,
  auth.changePassword
);

module.exports = router;