/* Run after `docker compose up --build -d`: node scripts/integrationCheck.js */
require('dotenv').config();
const baseUrl = process.env.NEXUS_API_URL;
if (!baseUrl) throw new Error('Missing NEXUS_API_URL in .env');
const report = { startedAt: new Date().toISOString(), checks: [] };

async function check(name, path, options, assertion = (body) => body.success !== false) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { headers: { 'content-type': 'application/json' }, ...options });
    const body = await response.json();
    const passed = response.ok && assertion(body);
    report.checks.push({ name, passed, status: response.status, response: body });
    return body;
  } catch (error) { report.checks.push({ name, passed: false, error: error.message }); return null; }
}

async function run() {
  await check('Docker connection and container discovery', '/status', {}, (body) => body.success && Object.values(body.services).every((service) => service.status === 'running'));
  await check('Status API', '/status');
  await check('Break backend', '/break/backend', { method: 'POST' });
  await check('Status reports backend failure', '/status', {}, (body) => body.services.backend.status !== 'running');
  await check('Rebuild backend', '/rebuild', { method: 'POST' }, (body) => body.success && body.productionRestored);
  await check('Sandbox creation', '/sandbox/create', { method: 'POST' });
  await check('Sandbox validation', '/sandbox/validate', { method: 'POST' }, (body) => body.passed);
  await check('Sandbox cleanup', '/sandbox', { method: 'DELETE' });
  report.finishedAt = new Date().toISOString();
  report.passed = report.checks.every((item) => item.passed);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.passed ? 0 : 1;
}
run();
