const dockerService = require('./dockerService');
const statusService = require('./statusService');
const timelineService = require('./timelineService');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const config = require('../config');

async function setTargetLatency(delayMs) {
  const url = new URL('/internal/latency', config.backendHealthUrl).toString();
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ delayMs }) });
  if (!response.ok) throw new AppError('Target backend rejected latency mode', 502, 'LATENCY_MODE_FAILED');
}

async function breakBackend() {
  const name = config.targetBackend;

  try {
    await dockerService.stopContainer(name);
    timelineService.addEvent('Backend container stopped via break engine', 'failure', {
      container: name,
      action: 'break-backend',
    }, 'critical');
    logger.info('Break action: backend stopped', { container: name });

    return {
      success: true,
      action: 'break-backend',
      message: 'Backend container stopped successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    logger.error('Break backend failed', { details: err.message });
    throw err;
  }
}

async function breakDatabase() {
  const name = config.targetDatabase;

  try {
    await dockerService.stopContainer(name);
    timelineService.addEvent('Database container stopped via break engine', 'failure', {
      container: name,
      action: 'break-database',
    }, 'critical');
    logger.info('Break action: database stopped', { container: name });

    return {
      success: true,
      action: 'break-database',
      message: 'Database container stopped successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    logger.error('Break database failed', { details: err.message });
    throw err;
  }
}

async function breakLatency(delayMs = 3000) {
  const name = config.targetBackend;
  const parsedDelay = parseInt(delayMs, 10) || 3000;

  try {
    const current = await dockerService.getContainerStatus(name);
    if (!current.exists) {
      throw new AppError('Backend container does not exist', 404, 'CONTAINER_NOT_FOUND');
    }
    await setTargetLatency(parsedDelay);
    statusService.setLatencyMode(true, parsedDelay);

    timelineService.addEvent(`Latency mode enabled (${parsedDelay}ms)`, 'failure', {
      container: name,
      action: 'break-latency',
      delayMs: parsedDelay,
    }, 'warning');

    logger.info('Break action: latency enabled', { container: name, delayMs: parsedDelay });

    return {
      success: true,
      action: 'break-latency',
      message: `Latency simulation enabled (${parsedDelay}ms delay)`,
      delayMs: parsedDelay,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (err.code === 'CONTAINER_NOT_FOUND') {
      throw new AppError('Backend container does not exist', 404, 'CONTAINER_NOT_FOUND');
    }
    logger.error('Break latency failed', { details: err.message });
    throw err;
  }
}

module.exports = {
  breakBackend,
  breakDatabase,
  breakLatency,
  setTargetLatency,
};
