const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const controller = require('../controllers/diagnosticsController');
router.get('/', asyncHandler(controller.getDiagnostics));
module.exports = router;
