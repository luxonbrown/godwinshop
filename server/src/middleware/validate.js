const { validationResult } = require('express-validator');

/** Runs express-validator checks and returns a 422 with fields on failure. */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(422).json({
    message: 'Please correct the highlighted fields.',
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg }))
  });
}

module.exports = { handleValidation };