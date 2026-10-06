require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env and set a value.`);
  return value.trim();
}

function number(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value < 0) throw new Error(`Environment variable ${name} must be a non-negative number.`);
  return value;
}

function getDockerSocket() {
  const envVal = process.env.DOCKER_SOCKET;
  const isWin = process.platform === 'win32';
  if (isWin && (!envVal || envVal === '/var/run/docker.sock')) {
    return '//./pipe/docker_engine';
  }
  return envVal || (isWin ? '//./pipe/docker_engine' : '/var/run/docker.sock');
}

const config = Object.freeze({
  groqApiKey: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '',
  groqModel: process.env.GROQ_MODEL ? process.env.GROQ_MODEL.trim() : 'llama-3.3-70b-versatile',
  port: number('PORT', 5000),
  targetFrontend: required('TARGET_FRONTEND'),
  targetBackend: required('TARGET_BACKEND'),
  targetDatabase: required('TARGET_DATABASE'),
  backendHealthUrl: required('BACKEND_HEALTH_URL'),
  frontendUrl: required('FRONTEND_URL'),
  frontendHealthUrl: required('FRONTEND_HEALTH_URL'),
  latencyThresholdMs: number('LATENCY_THRESHOLD_MS', 1000),
  validationLatencyThresholdMs: number('VALIDATION_LATENCY_THRESHOLD_MS', 1000),
  sandboxPrefix: required('SANDBOX_PREFIX'),
  dockerSocket: getDockerSocket(),
  nexusContainer: required('NEXUS_CONTAINER'),
  targetBackendPort: number('TARGET_BACKEND_PORT', 3000),
  database: {
    host: required('DB_HOST'), port: number('DB_PORT', 5432), name: required('DB_NAME'), user: required('DB_USER'), password: required('DB_PASSWORD'),
  },
  healthCheckIntervalMs: number('HEALTH_CHECK_INTERVAL_MS', 5000),
  healthTimeoutMs: number('HEALTH_TIMEOUT_MS', 3000),
  corsOrigins: required('CORS_ORIGIN').split(',').map((origin) => origin.trim()).filter(Boolean),
});

module.exports = config;
