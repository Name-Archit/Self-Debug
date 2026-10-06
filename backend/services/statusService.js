const dockerService = require('./dockerService');
const databaseService = require('./databaseService');
const logger = require('../utils/logger');
const config = require('../config');

const latencyState = {
  enabled: false,
  delayMs: 0,
};

let cachedStatus = null;

async function pingHealth(baseUrl, path = '', timeoutMs = config.healthTimeoutMs) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return {
      ok: response.ok,
      status: response.status,
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      status: 0,
      responseTimeMs: Date.now() - start,
      error: err.message,
    };
  }
}

function mapContainerHealth(containerStatus, httpHealth, latencyMs) {
  if (containerStatus.exists && !containerStatus.running) {
    return 'unhealthy';
  }

  if (httpHealth && httpHealth.ok) {
    if (latencyMs > config.latencyThresholdMs) {
      return 'degraded';
    }
    return 'healthy';
  }

  if (containerStatus.running) {
    return 'healthy';
  }

  return 'unhealthy';
}

async function getSystemStatus() {
  const [frontendContainer, backendContainer, dbContainer, frontendHealth, backendHealth, dbHealth] =
    await Promise.all([
      dockerService.getContainerStatus(config.targetFrontend),
      dockerService.getContainerStatus(config.targetBackend),
      dockerService.getContainerStatus(config.targetDatabase),
      pingHealth(config.frontendHealthUrl, '/'),
      pingHealth(config.backendHealthUrl),
      databaseService.checkConnectivity(),
    ]);

  const frontend = {
    status: frontendContainer.running ? 'running' : (frontendHealth.ok ? 'reachable' : frontendContainer.status),
    health: mapContainerHealth(frontendContainer, frontendHealth, frontendHealth.responseTimeMs),
    responseTimeMs: frontendHealth.responseTimeMs,
    uptime: formatUptime(frontendContainer.startedAt),
  };

  const backend = {
    status: backendContainer.running ? 'running' : (backendHealth.ok ? 'reachable' : backendContainer.status),
    health: mapContainerHealth(backendContainer, backendHealth, backendHealth.responseTimeMs),
    responseTimeMs: backendHealth.responseTimeMs,
    latencyMode: latencyState.enabled,
    uptime: formatUptime(backendContainer.startedAt),
  };

  const database = {
    status: dbContainer.running ? 'running' : (dbHealth.reachable ? 'reachable' : dbContainer.status),
    health: dbHealth.reachable ? 'healthy' : 'unhealthy',
    responseTimeMs: dbHealth.responseTimeMs,
    uptime: formatUptime(dbContainer.startedAt),
  };

  const components = [frontend.health, backend.health, database.health];
  let overallStatus = 'healthy';

  if (components.includes('unhealthy')) {
    overallStatus = 'unhealthy';
  } else if (components.includes('degraded')) {
    overallStatus = 'degraded';
  }

  const status = {
    success: true,
    services: { frontend, backend, database },
    overallStatus,
    timestamp: new Date().toISOString(),
  };

  cachedStatus = status;
  return status;
}

function formatUptime(startedAt) {
  if (!startedAt || startedAt.startsWith('0001-')) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function getCachedStatus() {
  return cachedStatus;
}

function setLatencyMode(enabled, delayMs = 0) {
  latencyState.enabled = enabled;
  latencyState.delayMs = delayMs;
  logger.info('Latency mode updated', { enabled, delayMs });
  return { ...latencyState };
}

function getLatencyState() {
  return { ...latencyState };
}

module.exports = {
  pingHealth,
  getSystemStatus,
  getCachedStatus,
  setLatencyMode,
  getLatencyState,
};
