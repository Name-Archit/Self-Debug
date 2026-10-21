const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  logger.error(err.message, {
    code,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    details: err.details || err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.isOperational ? err.message : 'An unexpected error occurred',
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
