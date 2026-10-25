const config = require('../config');

const startedAt = new Date().toISOString();
const state = {
  backendRunning: true,
  databaseRunning: true,
  latencyMs: 0,
};

function service(running, responseTimeMs, latencyMode = false) {
  const health = !running ? 'unhealthy' : responseTimeMs > config.latencyThresholdMs ? 'degraded' : 'healthy';
  return {
    running,
    status: running ? 'running' : 'stopped',
    health,
    responseTimeMs: running ? responseTimeMs : null,
    uptime: running ? formatUptime(startedAt) : null,
    ...(latencyMode ? { latencyMode: state.latencyMs > 0 } : {}),
  };
}

function getStatus() {
  const frontend = service(true, 25);
  const backend = service(state.backendRunning, 35 + state.latencyMs, true);
  const database = service(state.databaseRunning, 12);
  // A stopped simulated database makes the dependent backend unavailable too.
  if (!state.databaseRunning && state.backendRunning) {
    backend.health = 'unhealthy';
    backend.status = 'dependency_unavailable';
  }
  const values = [frontend.health, backend.health, database.health];
  return {
    success: true,
    mode: 'simulated',
    capabilities: { dockerControl: false, simulatedChaos: true },
    services: { frontend, backend, database },
    overallStatus: values.includes('unhealthy') ? 'unhealthy' : values.includes('degraded') ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
  };
}

function stopBackend() { state.backendRunning = false; }
function stopDatabase() { state.databaseRunning = false; }
function setLatency(delayMs) { state.latencyMs = Math.max(0, Number(delayMs) || 0); }
function restore() { state.backendRunning = true; state.databaseRunning = true; state.latencyMs = 0; }

function formatUptime(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

module.exports = { getStatus, stopBackend, stopDatabase, setLatency, restore };
