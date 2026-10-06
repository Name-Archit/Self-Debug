const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const controller = require('../controllers/aiController');
router.post('/analyze', asyncHandler(controller.analyze));
module.exports = router;
