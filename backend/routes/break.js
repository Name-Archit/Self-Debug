const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const controller = require('../controllers/breakController');
const { validateLatency } = require('../validators/breakValidator');
router.post('/backend', asyncHandler(controller.breakBackend));
router.post('/database', asyncHandler(controller.breakDatabase));
router.post('/latency', validateLatency, asyncHandler(controller.breakLatency));
module.exports = router;
