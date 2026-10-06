const router = require('express').Router();
const controller = require('../controllers/timelineController');
router.get('/', controller.getTimeline);
module.exports = router;
