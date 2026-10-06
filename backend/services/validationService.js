const dockerService = require('./dockerService');
const databaseService = require('./databaseService');
const statusService = require('./statusService');
const timelineService = require('./timelineService');
const logger = require('../utils/logger');
const config = require('../config');

let forceFail = false;

function setForceFail(value) {
  forceFail = !!value;
}

function getForceFail() {
  return forceFail;
}

async function validate(options = {}) {
  const isDbFailure = options.isDbFailure || false;
  const sandboxName = `${config.targetBackend}-sandbox`;
  const sandboxUrl = `http://${sandboxName}:${config.targetBackendPort}`;
  const threshold = config.latencyThresholdMs;

  let containerStatus = { running: false };
  let healthRes = { ok: false, status: 0, responseTimeMs: 0 };
  let apiRes = { ok: false, status: 0, responseTimeMs: 0 };

  // Poll readiness (up to 5 attempts with 500ms delay)
  for (let attempt = 1; attempt <= 5; attempt++) {
    containerStatus = await dockerService.getContainerStatus(sandboxName);
    if (containerStatus.running) {
      healthRes = await statusService.pingHealth(sandboxUrl, '/health');
      apiRes = await statusService.pingHealth(sandboxUrl, '/api/ping');
      if (healthRes.ok && apiRes.ok) break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  let dbRes;
  if (isDbFailure) {
    dbRes = {
      reachable: healthRes.ok,
      responseTimeMs: healthRes.responseTimeMs || 0,
      error: healthRes.ok ? null : (healthRes.error || 'Sandbox DB connectivity check failed'),
    };
  } else {
    dbRes = await databaseService.checkConnectivity();
  }

  const maxLatency = Math.max(healthRes.responseTimeMs || 0, apiRes.responseTimeMs || 0);

  const checks = [
    {
      name: 'backend running',
      status: containerStatus.running ? 'PASS' : 'FAIL',
      details: containerStatus.running ? 'Sandbox container is running' : (containerStatus.error || 'Sandbox container not running'),
    },
    {
      name: 'health endpoint',
      status: healthRes.ok ? 'PASS' : 'FAIL',
      details: healthRes.ok ? `HTTP ${healthRes.status} (${healthRes.responseTimeMs}ms)` : (healthRes.error || `HTTP ${healthRes.status}`),
    },
    {
      name: 'api ping',
      status: apiRes.ok ? 'PASS' : 'FAIL',
      details: apiRes.ok ? `HTTP ${apiRes.status} (${apiRes.responseTimeMs}ms)` : (apiRes.error || `HTTP ${apiRes.status}`),
    },
    {
      name: 'database reachable',
      status: dbRes.reachable ? 'PASS' : 'FAIL',
      details: dbRes.reachable ? `DB connected (${dbRes.responseTimeMs}ms)` : (dbRes.error || 'Database unreachable'),
    },
    {
      name: 'latency acceptable',
      status: (healthRes.ok || apiRes.ok) && maxLatency <= threshold ? 'PASS' : 'FAIL',
      details: `Max latency: ${maxLatency}ms (threshold: ${threshold}ms)`,
    },
  ];

  if (forceFail) {
    checks.push({
      name: 'forced validation fail (test mode)',
      status: 'FAIL',
      details: 'Force fail test mode is active',
    });
  }

  const passed = checks.every((check) => check.status === 'PASS');
  const result = {
    result: passed ? 'PASS' : 'FAIL',
    checks,
    validatedAt: new Date().toISOString(),
  };

  logger.info(`Sandbox validation result: ${result.result}`);
  checks.forEach((c) => {
    logger.info(`  ${c.name}: ${c.status} - ${c.details}`);
  });

  timelineService.addEvent(`Validation ${result.result}`);
  return result;
}

module.exports = { validate, setForceFail, getForceFail };
