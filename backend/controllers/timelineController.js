const timelineService = require('../services/timelineService');

function getTimeline(req, res) {
  const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10) || 50, 1), 200);
  res.json(timelineService.getEvents(limit));
}

module.exports = { getTimeline };
