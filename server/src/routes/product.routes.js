const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const productController = require('../controllers/productController');
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { handleValidation } = require('../middleware/validate');

const productRules = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Product name must be at least 2 characters'),
  body('description').optional({ values: 'falsy' }).trim(),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than zero'),
  body('discount_price').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Discount price must be a positive number'),
  body('category_id').isInt({ min: 1 }).withMessage('A valid category is required'),
  body('sku').trim().isLength({ min: 2, max: 64 }).withMessage('SKU must be between 2 and 64 characters'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock must be a whole number'),
  body('status').optional().isIn(['active', 'inactive', 'out_of_stock']).withMessage('Invalid status')
];

// Public
router.get('/', productController.listProducts);
router.get('/:id(\\d+)', productController.getProduct);

// Admin CRUD (image upload included)
router.post('/', requireAdmin, upload.single('image'), productRules, handleValidation, productController.createProduct);
router.put('/:id(\\d+)', requireAdmin, upload.single('image'), productRules, handleValidation, productController.updateProduct);
router.delete('/:id(\\d+)', requireAdmin, productController.deleteProduct);

module.exports = router;