const breakService = require('../services/breakService');

async function breakBackend(req, res) {
  res.json(await breakService.breakBackend());
}

async function breakDatabase(req, res) {
  res.json(await breakService.breakDatabase());
}

async function breakLatency(req, res) {
  res.json(await breakService.breakLatency(req.body.delayMs));
}

module.exports = { breakBackend, breakDatabase, breakLatency };
