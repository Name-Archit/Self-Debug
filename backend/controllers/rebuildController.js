const rebuildService = require('../services/rebuildService');

async function rebuild(req, res) {
  res.json(await rebuildService.rebuild());
}

module.exports = { rebuild };
