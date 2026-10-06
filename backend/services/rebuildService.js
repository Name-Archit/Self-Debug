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
    return dockerService.startContainer(config.targetDatabase);
  }

  return null;
}

async function rebuild() {
  const diagnosis = await diagnosticsService.diagnose();

  if (diagnosis.isMultipleFailures) {
    return {
      success: false,
      diagnosis,
      message: 'Multiple simultaneous failures are not supported by the MVP. Reset the environment and repair one failure at a time.',
      productionRestored: false,
    };
  }

  if (!diagnosis.failedService) {
    return {
      success: true,
      diagnosis,
      message: 'No failure detected',
      productionRestored: true,
    };
  }

  timelineService.addEvent(`Failure detected: ${diagnosis.failedService}`);

  const isDbFailure = diagnosis.failedService === config.targetDatabase;
  let sandbox = null;

  try {
    sandbox = await sandboxService.create({ isDbFailure });
    timelineService.addEvent('Validation started');

    const validation = await validationService.validate({ isDbFailure });

    if (validation.result !== 'PASS') {
      await sandboxService.remove();
      timelineService.addEvent('Validation failed; sandbox removed');

      return {
        success: false,
        diagnosis,
        sandbox,
        validation,
        productionRestored: false,
      };
    }

    timelineService.addEvent('Validation passed');

    const restoreResult = await restore(diagnosis.failedService, diagnosis.probableCause);

    // Verify production health post-restoration
    await new Promise((r) => setTimeout(r, 1000));
    const postStatus = await statusService.getSystemStatus();
    const isProductionHealthy = postStatus.overallStatus === 'healthy';

    await sandboxService.remove();

    if (isProductionHealthy) {
      timelineService.addEvent('Production restored');
    } else {
      timelineService.addEvent('Production restoration completed');
    }

    return {
      success: true,
      diagnosis,
      sandbox,
      validation,
      productionRestored: true,
      restoreResult,
    };
  } catch (error) {
    if (sandbox) {
      await sandboxService.remove().catch(() => {});
    }
    throw error;
  }
}

module.exports = { rebuild };
