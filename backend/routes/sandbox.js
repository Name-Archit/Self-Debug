const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const controller = require('../controllers/sandboxController');
router.post('/create', asyncHandler(controller.createSandbox));
router.post('/validate', asyncHandler(controller.validateSandbox));
router.delete('/', asyncHandler(controller.removeSandbox));
router.post('/force-fail', (req, res) => {
  const validationService = require('../services/validationService');
  validationService.setForceFail(req.body.forceFail);
  res.json({ success: true, forceFail: validationService.getForceFail() });
});
module.exports = router;
