const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const { requireAdmin } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');

const categoryRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Category name must be at least 2 characters'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Description is too long')
];

router.get('/', categoryController.listCategories);
router.get('/:id(\\d+)', categoryController.getCategory);

router.post('/', requireAdmin, categoryRules, handleValidation, categoryController.createCategory);
router.put('/:id(\\d+)', requireAdmin, categoryRules, handleValidation, categoryController.updateCategory);
router.delete('/:id(\\d+)', requireAdmin, categoryController.deleteCategory);

module.exports = router;