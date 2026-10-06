const statusService = require('../services/statusService');

async function getStatus(req, res) {
  res.json(await statusService.getSystemStatus());
}

module.exports = { getStatus };
