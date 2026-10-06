const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      connectionTimeoutMillis: config.healthTimeoutMs,
      max: 3,
    });

    pool.on('error', (err) => {
      logger.error('PostgreSQL pool error', { details: err.message });
    });
  }
  return pool;
}

async function checkConnectivity() {
  const start = Date.now();
  try {
    const client = await getPool().connect();
    await client.query('SELECT 1');
    client.release();
    return {
      reachable: true,
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    return {
      reachable: false,
      responseTimeMs: Date.now() - start,
      error: err.message,
    };
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  checkConnectivity,
  closePool,
};
