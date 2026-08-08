const multer = require('multer');

/**
 * Central error handler. Never exposes raw database/stack details to clients
 * outside development.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Multer errors (file too large / bad file type)
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum upload size is 5MB.'
        : `Upload failed: ${err.message}`;
    return res.status(400).json({ message });
  }
  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ message: err.message });
  }

  // Database unique-constraint violations → friendly messages
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      message: 'That value already exists. Please use a different one.',
      code: 'DUPLICATE'
    });
  }

  const status = err.status || 500;
  const payload = {
    message:
      status === 500
        ? 'Server error. Please try again later.'
        : err.message || 'Something went wrong.',
    code: err.code
  };
  if (err.details) payload.details = err.details;
  if (status === 500) console.error('[ErrorHandler]', err);
  res.status(status).json(payload);
}

/** Catch-all for unknown API routes. */
function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Endpoint not found.' });
}

module.exports = { errorHandler, notFoundHandler };