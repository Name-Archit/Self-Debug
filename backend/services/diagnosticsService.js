const statusService = require('./statusService');
const config = require('../config');

function diagnosisFor(status) {
  const { backend, database } = status.services;

  const isBackendStopped = !backend.running || backend.status !== 'running';
  const isDbStopped = !database.health || database.status === 'exited' || database.status === 'not_found' || database.status === 'stopped';
  const isLatencyHigh = backend.running && (backend.health === 'degraded' || backend.latencyMode || (backend.responseTimeMs && backend.responseTimeMs > config.latencyThresholdMs));

  // If DB container is stopped, backend HTTP health check returns unhealthy (503). That is a single DB failure.
  if (isDbStopped && !isBackendStopped) {
    return {
      isMultipleFailures: false,
      failedService: config.targetDatabase,
      probableCause: 'Database container is stopped or PostgreSQL is unavailable',
      recommendedRepair: 'start database container',
    };
  }

  // If Backend container itself is stopped
  if (isBackendStopped && !isDbStopped) {
    return {
      isMultipleFailures: false,
      failedService: config.targetBackend,
      probableCause: 'Backend container is stopped or exited',
      recommendedRepair: 'start backend container',
    };
  }

  if (isLatencyHigh) {
    return {
      isMultipleFailures: false,
      failedService: config.targetBackend,
      probableCause: 'Backend response latency exceeds the configured limit',
      recommendedRepair: 'disable latency mode',
    };
  }

  // If both containers are stopped or multiple independent failures exist
  let stoppedCount = 0;
  if (isBackendStopped) stoppedCount++;
  if (isDbStopped) stoppedCount++;

  if (stoppedCount > 1) {
    return {
      isMultipleFailures: true,
      failedService: null,
      probableCause: 'Multiple simultaneous failures detected',
      recommendedRepair: 'Reset the environment and repair one failure at a time.',
    };
  }

  return {
    isMultipleFailures: false,
    failedService: null,
    probableCause: 'No active failure detected',
    recommendedRepair: 'none',
  };
}

async function diagnose() {
  const status = await statusService.getSystemStatus();
  return {
    ...diagnosisFor(status),
    observedAt: new Date().toISOString(),
    status,
  };
}

module.exports = { diagnose, diagnosisFor };
