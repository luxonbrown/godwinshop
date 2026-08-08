class ApiError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code || 'ERROR';
    this.details = details;
  }
}

const notFound = (res, message = 'Resource not found') =>
  res.status(404).json({ message });

module.exports = { ApiError, notFound };