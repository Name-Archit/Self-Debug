const diagnosticsService = require('../services/diagnosticsService');

async function getDiagnostics(req, res) {
  res.json(await diagnosticsService.diagnose());
}

module.exports = { getDiagnostics };
