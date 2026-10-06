const sandboxService = require('../services/sandboxService');
const validationService = require('../services/validationService');

async function createSandbox(req, res) {
  res.status(201).json({ success: true, sandbox: await sandboxService.create(req.body || {}) });
}

async function validateSandbox(req, res) {
  res.json(await validationService.validate());
}

async function removeSandbox(req, res) {
  res.json({ success: true, sandbox: await sandboxService.remove() });
}

module.exports = { createSandbox, validateSandbox, removeSandbox };
