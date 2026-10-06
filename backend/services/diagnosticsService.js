const statusService = require('./statusService');
const config = require('../config');

function diagnosisFor(status) {
  const { backend, database } = status.services;

  const isBackendDown = !backend.running || backend.status !== 'running';
  const isDbDown = !database.health || database.health === 'unhealthy';
  const isLatencyHigh = backend.running && backend.health === 'degraded';

  let failureCount = 0;
  if (isBackendDown) failureCount++;
  if (isDbDown) failureCount++;
  if (isLatencyHigh) failureCount++;

  if (failureCount > 1) {
    return {
      isMultipleFailures: true,
      failedService: null,
      probableCause: 'Multiple simultaneous failures detected',
      recommendedRepair: 'Reset the environment and repair one failure at a time.',
    };
  }

  if (isBackendDown) {
    return {
      isMultipleFailures: false,
      failedService: 'target-backend',
      probableCause: 'Backend container is stopped or exited',
      recommendedRepair: 'start backend container',
    };
  }

  if (isDbDown) {
    return {
      isMultipleFailures: false,
      failedService: 'target-db',
      probableCause: 'Database container is stopped or PostgreSQL is unavailable',
      recommendedRepair: 'start database container',
    };
  }

  if (isLatencyHigh) {
    return {
      isMultipleFailures: false,
      failedService: 'target-backend',
      probableCause: 'Backend response latency exceeds the configured limit',
      recommendedRepair: 'disable latency mode and restart backend',
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
