const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const controller = require('../controllers/statusController');
router.get('/', asyncHandler(controller.getStatus));
module.exports = router;
