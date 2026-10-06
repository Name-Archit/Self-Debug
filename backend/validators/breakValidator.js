const AppError = require('../utils/AppError');

function validateLatency(req, res, next) {
  if (req.body.delayMs === undefined) return next();
  const delayMs = Number(req.body.delayMs);
  if (!Number.isInteger(delayMs) || delayMs < 1 || delayMs > 30000) {
    return next(new AppError('delayMs must be an integer between 1 and 30000', 400, 'INVALID_DELAY'));
  }
  req.body.delayMs = delayMs;
  next();
}
module.exports = { validateLatency };
