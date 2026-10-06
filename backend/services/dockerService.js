const Docker = require('dockerode');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const config = require('../config');

const docker = new Docker({ socketPath: config.dockerSocket });

async function verifyConnection() {
  try {
    const info = await docker.info();
    logger.info('Docker daemon connected', { serverVersion: info.ServerVersion, containers: info.Containers });
    return { connected: true, serverVersion: info.ServerVersion, containers: info.Containers };
  } catch (err) {
    logger.warn('Docker daemon connection unavailable (running in host dev mode or socket unmounted)', { socket: config.dockerSocket, details: err.message });
    return { connected: false, error: err.message };
  }
}

async function getContainerByName(name) {
  const containers = await docker.listContainers({ all: true });
  const match = containers.find((c) => c.Names.some((n) => n === `/${name}` || n === name));
  return match || null;
}

async function getContainer(name) {
  const listed = await getContainerByName(name);
  if (!listed) {
    throw new AppError(`Container "${name}" does not exist`, 404, 'CONTAINER_NOT_FOUND');
  }
  return docker.getContainer(listed.Id);
}

async function getContainerStatus(name) {
  let listed;
  try {
    listed = await getContainerByName(name);
  } catch (err) {
    return { name, exists: false, status: 'unavailable', running: false, health: 'unknown', restartCount: 0, error: err.message };
  }

  if (!listed) {
    return {
      name,
      exists: false,
      status: 'not_found',
      running: false,
      health: 'unknown',
      restartCount: 0,
    };
  }

  const container = docker.getContainer(listed.Id);
  const inspect = await container.inspect();

  const running = inspect.State.Running;
  const restartCount = inspect.RestartCount || 0;
  let health = 'unknown';

  if (inspect.State.Health) {
    health = inspect.State.Health.Status;
  } else if (running) {
    health = 'healthy';
  } else {
    health = 'unhealthy';
  }

  return {
    name,
    exists: true,
    id: listed.Id,
    status: running ? 'running' : inspect.State.Status,
    running,
    health,
    restartCount,
    startedAt: inspect.State.StartedAt,
    finishedAt: inspect.State.FinishedAt,
    image: inspect.Config.Image,
  };
}

async function stopContainer(name) {
  const container = await getContainer(name);
  const inspect = await container.inspect();

  if (!inspect.State.Running) {
    logger.warn('Container already stopped', { container: name });
    return { name, action: 'stop', alreadyStopped: true };
  }

  await container.stop({ t: 5 });
  logger.info('Container stopped', { container: name });
  return { name, action: 'stop', alreadyStopped: false };
}

async function startContainer(name) {
  const container = await getContainer(name);
  const inspect = await container.inspect();

  if (inspect.State.Running) {
    logger.warn('Container already running', { container: name });
    return { name, action: 'start', alreadyRunning: true };
  }

  await container.start();
  logger.info('Container started', { container: name });
  return { name, action: 'start', alreadyRunning: false };
}

async function restartContainer(name) {
  const container = await getContainer(name);
  await container.restart({ t: 5 });
  logger.info('Container restarted', { container: name });
  return { name, action: 'restart' };
}

async function inspectContainer(name) {
  const container = await getContainer(name);
  return container.inspect();
}

async function getContainerLogs(name, tail = 50) {
  try {
    const container = await getContainer(name);
    const output = await container.logs({ stdout: true, stderr: true, tail, timestamps: true });
    return output.toString('utf8').trim().split('\n').filter(Boolean);
  } catch (err) {
    logger.warn('Container log collection failed', { container: name, details: err.message });
    return [];
  }
}

async function listContainers() {
  const containers = await docker.listContainers({ all: true });
  return containers.map((c) => ({
    id: c.Id,
    names: c.Names,
    image: c.Image,
    state: c.State,
    status: c.Status,
  }));
}

async function listTargetContainers() {
  const names = [config.targetFrontend, config.targetBackend, config.targetDatabase];
  return Promise.all(names.map((name) => getContainerStatus(name)));
}

async function createSandboxDb(options = {}) {
  const dbName = options.name || 'sandbox-db';
  const existing = await getContainerByName(dbName);
  if (existing) {
    await removeSandbox(dbName);
  }

  const networkName = options.network || 'nexus-network';
  const container = await docker.createContainer({
    name: dbName,
    Image: 'postgres:16-alpine',
    Env: [
      `POSTGRES_DB=${config.database.name}`,
      `POSTGRES_USER=${config.database.user}`,
      `POSTGRES_PASSWORD=${config.database.password}`,
    ],
    HostConfig: {
      NetworkMode: networkName,
      AutoRemove: false,
    },
    Labels: {
      'nexus.role': 'sandbox-db',
      'nexus.created': new Date().toISOString(),
    },
  });

  await container.start();
  logger.info('Sandbox DB container created and started', { container: dbName, network: networkName });

  // Poll DB container readiness
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const inspect = await container.inspect().catch(() => null);
    if (inspect?.State?.Running) break;
  }

  return {
    name: dbName,
    id: container.id,
    network: networkName,
    createdAt: new Date().toISOString(),
  };
}

async function createSandbox(options = {}) {
  const sandboxName = options.name || `${config.targetBackend}-sandbox`;
  const targetName = config.targetBackend;

  const existing = await getContainerByName(sandboxName);
  if (existing) {
    await removeSandbox(sandboxName);
  }

  let env = [
    `PORT=${config.targetBackendPort}`,
    `LATENCY_MS=0`,
    `DB_HOST=${config.database.host}`,
    `DB_PORT=${config.database.port}`,
    `DB_NAME=${config.database.name}`,
    `DB_USER=${config.database.user}`,
    `DB_PASSWORD=${config.database.password}`,
    'SANDBOX=true',
  ];

  try {
    const targetContainer = await getContainer(targetName);
    const targetInspect = await targetContainer.inspect();
    if (targetInspect?.Config?.Env) {
      env = targetInspect.Config.Env.map((e) => (e.startsWith('LATENCY_MS=') ? 'LATENCY_MS=0' : e));
      if (!env.some((e) => e.startsWith('SANDBOX='))) {
        env.push('SANDBOX=true');
      }
    }
  } catch (err) {
    logger.warn('Could not inspect target container env, using default config environment', { error: err.message });
  }

  if (options.customEnv && Array.isArray(options.customEnv)) {
    options.customEnv.forEach((override) => {
      const key = override.split('=')[0];
      env = env.filter((e) => !e.startsWith(`${key}=`));
      env.push(override);
    });
  }

  const networkName = options.network || 'nexus-network';
  const container = await docker.createContainer({
    name: sandboxName,
    Image: options.image || 'nexus-target-backend:latest',
    Env: env,
    ExposedPorts: { [`${config.targetBackendPort}/tcp`]: {} },
    HostConfig: {
      NetworkMode: networkName,
      AutoRemove: false,
    },
    Labels: {
      'nexus.role': 'sandbox',
      'nexus.created': new Date().toISOString(),
    },
  });

  await container.start();
  logger.info('Sandbox container created and started', { container: sandboxName, network: networkName });

  return {
    name: sandboxName,
    id: container.id,
    image: options.image || 'nexus-target-backend:latest',
    network: networkName,
    createdAt: new Date().toISOString(),
  };
}

async function removeSandbox(name) {
  const sandboxName = name || `${config.targetBackend}-sandbox`;
  const listed = await getContainerByName(sandboxName);

  if (!listed) {
    return { name: sandboxName, removed: false, reason: 'not_found' };
  }

  const container = docker.getContainer(listed.Id);
  const inspect = await container.inspect();

  try {
    if (inspect.State.Running) {
      await container.stop({ t: 3 });
    }
  } catch (err) {
    logger.warn('Error stopping sandbox before removal', { error: err.message });
  }

  await container.remove({ force: true });
  logger.info('Sandbox container removed', { container: sandboxName });
  return { name: sandboxName, removed: true };
}

module.exports = {
  docker,
  verifyConnection,
  getContainerByName,
  getContainer,
  getContainerStatus,
  stopContainer,
  startContainer,
  restartContainer,
  inspectContainer,
  getContainerLogs,
  listContainers,
  listTargetContainers,
  createSandbox,
  createSandboxDb,
  removeSandbox,
};
