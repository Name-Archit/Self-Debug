const config = require('./config');
const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const monitorService = require('./services/monitorService');
const databaseService = require('./services/databaseService');
const dockerService = require('./services/dockerService');
const logger = require('./utils/logger');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '100kb' }));
app.use(requestLogger);
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'nexus-control-server', timestamp: new Date().toISOString() }));
app.use('/api/status', require('./routes/status'));
app.use('/api/break', require('./routes/break'));
app.use('/api/diagnostics', require('./routes/diagnostics'));
app.use('/api/sandbox', require('./routes/sandbox'));
app.use('/api/rebuild', require('./routes/rebuild'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/ai', require('./routes/ai'));
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, async () => { logger.info('Nexus control server started', { port: config.port }); await dockerService.verifyConnection(); monitorService.start(); });
function shutdown(signal) { logger.info('Shutdown requested', { signal }); monitorService.stop(); databaseService.closePool().finally(() => server.close(() => process.exit(0))); }
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
module.exports = app;
