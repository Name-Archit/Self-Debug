const express = require('express');
const { Pool } = require('pg');
const app = express();
app.use(express.json());
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 3000,
});
pool.on('error', (err) => {
  console.error('Target backend database pool error:', err.message);
});
const delay = () => new Promise((resolve) => setTimeout(resolve, Number(process.env.LATENCY_MS || 0)));
app.get('/health', async (req, res) => {
  await delay();
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy' });
  } catch (_) {
    res.status(503).json({ status: 'unhealthy' });
  }
});
app.get('/api/ping', async (req, res) => {
  await delay();
  res.json({ ok: true });
});
app.post('/internal/latency', (req, res) => {
  process.env.LATENCY_MS = String(Math.max(0, Number(req.body.delayMs) || 0));
  res.json({ enabled: Number(process.env.LATENCY_MS) > 0, delayMs: Number(process.env.LATENCY_MS) });
});
app.listen(3000);
