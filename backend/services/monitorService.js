const statusService = require('./statusService');
const timelineService = require('./timelineService');
const logger = require('../utils/logger');
const config = require('../config');

let timer = null;
let previousOverallStatus = null;

async function check() {
  try {
    const status = await statusService.getSystemStatus();
    if (previousOverallStatus && previousOverallStatus !== status.overallStatus) {
      timelineService.addEvent(`System status changed from ${previousOverallStatus} to ${status.overallStatus}`, status.overallStatus === 'healthy' ? 'recovery' : 'failure', { status }, status.overallStatus === 'healthy' ? 'info' : 'critical');
    }
    previousOverallStatus = status.overallStatus;
    return status;
  } catch (err) {
    logger.error('Health monitor failed', { details: err.message });
    return null;
  }
}

function start() {
  if (timer) return;
  const interval = config.healthCheckIntervalMs;
  check();
  timer = setInterval(check, interval);
  logger.info('Health monitor started', { intervalMs: interval });
}

function stop() { if (timer) clearInterval(timer); timer = null; }
module.exports = { start, stop, check };
