const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const controller = require('../controllers/rebuildController');
router.post('/', asyncHandler(controller.rebuild));
module.exports = router;
