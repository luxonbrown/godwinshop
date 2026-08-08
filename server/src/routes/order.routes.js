const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { requireAuth, requireAdmin, requireVerified } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');

// Customer
router.post(
  '/',
  requireAuth,
  requireVerified,
  body('items').isArray({ min: 1 }).withMessage('Your cart is empty'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Invalid product'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Invalid quantity'),
  body('delivery_address').trim().isLength({ min: 5, max: 500 }).withMessage('Delivery address is required'),
  body('delivery_city').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  body('delivery_phone').trim().isLength({ min: 5, max: 40 }).withMessage('Phone number is required'),
  body('delivery_instructions').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  handleValidation,
  orderController.createOrder
);

router.get('/mine', requireAuth, orderController.listMyOrders);
router.get('/:id(\\d+)', requireAuth, (req, res, next) => {
  const isAdmin = req.session && req.session.user && req.session.user.role === 'admin';
  return isAdmin ? orderController.getAdminOrder(req, res, next) : orderController.getMyOrder(req, res, next);
});
router.post('/:id(\\d+)/cancel', requireAuth, orderController.cancelMyOrder);

// Admin
router.get('/', requireAdmin, orderController.listAllOrders);
router.put('/:id(\\d+)/status', requireAdmin, body('status').isIn(orderController.ORDER_STATUSES).withMessage('Invalid status'), handleValidation, orderController.updateOrderStatus);
router.put('/:id(\\d+)/delivery-date', requireAdmin, body('date').isISO8601().withMessage('Invalid delivery date'), handleValidation, orderController.setDeliveryDate);

module.exports = router;