const aiService = require('../services/aiService');
async function analyze(req, res) { res.json({ success: true, analysis: await aiService.analyze() }); }
module.exports = { analyze };
