const dockerService = require('./dockerService');
const timelineService = require('./timelineService');
const config = require('../config');

async function create(options = {}) {
  const targetName = config.targetBackend;
  const isDbFailure = options.isDbFailure || false;

  let sandboxDb = null;
  if (isDbFailure) {
    sandboxDb = await dockerService.createSandboxDb({
      name: 'sandbox-db',
      network: options.network || 'nexus-network',
    });
    timelineService.addEvent('Sandbox DB created');
  }

  const inspect = await dockerService.inspectContainer(targetName).catch(() => null);

  const customEnv = [];
  if (isDbFailure) {
    customEnv.push('DB_HOST=sandbox-db');
  }

  const sandbox = await dockerService.createSandbox({
    name: `${targetName}-sandbox`,
    image: options.image || inspect?.Config?.Image || 'nexus-target-backend:latest',
    network: inspect?.HostConfig?.NetworkMode || 'nexus-network',
    customEnv,
  });

  timelineService.addEvent('Sandbox created');

  return {
    ...sandbox,
    sandboxDb,
  };
}

async function remove() {
  const resultBackend = await dockerService.removeSandbox(`${config.targetBackend}-sandbox`).catch(() => ({ removed: false }));
  const resultDb = await dockerService.removeSandbox('sandbox-db').catch(() => ({ removed: false }));

  if (resultBackend.removed || resultDb.removed) {
    timelineService.addEvent('Sandbox removed');
  }

  return {
    backendRemoved: resultBackend.removed,
    dbRemoved: resultDb.removed,
    removed: resultBackend.removed || resultDb.removed,
  };
}

module.exports = {
  create,
  remove,
};
