const diagnosticsService = require('./diagnosticsService');
const sandboxService = require('./sandboxService');
const validationService = require('./validationService');
const dockerService = require('./dockerService');
const statusService = require('./statusService');
const timelineService = require('./timelineService');
const config = require('../config');

async function restore(service, probableCause) {
  if (probableCause && probableCause.toLowerCase().includes('latency')) {
    const { setTargetLatency } = require('./breakService');
    try {
      await setTargetLatency(0);
      statusService.setLatencyMode(false, 0);
      return { action: 'clear-latency', success: true };
    } catch (err) {
      await dockerService.restartContainer(config.targetBackend);
      statusService.setLatencyMode(false, 0);
      return { action: 'restart-backend', success: true };
    }
  }

  if (service === config.targetBackend) {
    return dockerService.startContainer(config.targetBackend);
  }

  if (service === config.targetDatabase) {
    const dbRes = await dockerService.startContainer(config.targetDatabase);
    // If target-backend exited when DB went down, ensure target-backend is also running
    const backendStatus = await dockerService.getContainerStatus(config.targetBackend);
    if (!backendStatus.running) {
      await dockerService.startContainer(config.targetBackend);
    }
    return dbRes;
  }

  return null;
}

async function waitForReadiness(failedService, isLatency) {
  const maxAttempts = 15;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const status = await statusService.getSystemStatus();
    
    if (isLatency) {
      if (status.services.backend.health === 'healthy' && status.services.backend.responseTimeMs <= config.latencyThresholdMs) {
        return true;
      }
    } else if (failedService === config.targetDatabase) {
      if (status.services.database.health === 'healthy' && status.services.backend.health === 'healthy') {
        return true;
      }
    } else if (failedService === config.targetBackend) {
      if (status.services.backend.health === 'healthy') {
        return true;
      }
    }
  }
  return false;
}

async function rebuild() {
  const diagnosis = await diagnosticsService.diagnose();

  if (diagnosis.isMultipleFailures) {
    timelineService.addEvent('Multiple failures detected; starting full service recovery');
    await dockerService.startContainer(config.targetDatabase);
    await dockerService.startContainer(config.targetBackend);
    await dockerService.startContainer(config.targetFrontend);
    const restored = await waitForFullReadiness();
    timelineService.addEvent(restored ? 'Full service recovery completed' : 'Full service recovery started; health checks are still pending');
    return {
      success: restored,
      failureType: 'MULTIPLE_FAILURES',
      diagnosis,
      appliedFix: 'Started database, backend, and frontend containers',
      verified: restored,
      productionRestored: restored,
    };
  }

  if (!diagnosis.failedService) {
    return {
      success: true,
      failureType: 'NONE',
      diagnosis,
      message: 'No failure detected',
      appliedFix: 'System is already healthy',
      verified: true,
      productionRestored: true,
    };
  }

  const isLatency = diagnosis.probableCause && diagnosis.probableCause.toLowerCase().includes('latency');
  const failureType = isLatency
    ? 'HIGH_LATENCY'
    : diagnosis.failedService === config.targetDatabase
    ? 'DATABASE_DOWN'
    : 'BACKEND_DOWN';

  timelineService.addEvent(`Deterministic repair initiated for ${failureType}`);

  const restoreResult = await restore(diagnosis.failedService, diagnosis.probableCause);
  const isReady = await waitForReadiness(diagnosis.failedService, isLatency);

  const postStatus = await statusService.getSystemStatus();
  const verified = isReady && postStatus.overallStatus === 'healthy';

  if (verified) {
    timelineService.addEvent(`Deterministic repair verified: System healthy`);
  } else {
    timelineService.addEvent(`Deterministic repair warning: Readiness check unverified`);
  }

  return {
    success: verified,
    failureType,
    diagnosis,
    appliedFix: restoreResult?.action ? `Executed ${restoreResult.action}` : `Restored ${diagnosis.failedService}`,
    verified,
    productionRestored: verified,
    restoreResult,
  };
}

async function waitForFullReadiness() {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const status = await statusService.getSystemStatus();
    if (status.overallStatus === 'healthy') return true;
  }
  return false;
}

module.exports = { rebuild };
