const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const config = require('../config');
const statusService = require('./statusService');
const diagnosticsService = require('./diagnosticsService');
const dockerService = require('./dockerService');
const AppError = require('../utils/AppError');

function getGroqClient() {
  if (!config.groqApiKey || config.groqApiKey === 'your_groq_api_key' || config.groqApiKey.trim() === '') {
    throw new AppError('Groq API key is missing or not configured. AI diagnosis is unavailable.', 400, 'GROQ_API_KEY_MISSING');
  }
  return new Groq({ apiKey: config.groqApiKey, timeout: 30000, maxRetries: 2 });
}

function recentLogs() {
  try {
    return fs.readFileSync(path.join(__dirname, '..', 'logs', 'nexus.log'), 'utf8').trim().split('\n').slice(-20);
  } catch (_) {
    return [];
  }
}

async function analyze() {
  const client = getGroqClient();

  const [status, diagnostics, backendLogs] = await Promise.all([
    statusService.getSystemStatus(),
    diagnosticsService.diagnose(),
    dockerService.getContainerLogs(config.targetBackend, 20),
  ]);

  try {
    const model = config.groqModel || 'llama-3.3-70b-versatile';
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior SRE. Diagnose from the supplied evidence only. Recommend safe, deterministic repairs such as starting a stopped container and checking dependencies. Never recommend deleting data, schema changes, shell commands, or production configuration changes. You MUST return a JSON object with the keys "diagnosis" (string), "rootCause" (string), and "repairPlan" (array of strings).',
        },
        {
          role: 'user',
          content: JSON.stringify({
            containerStatus: status.services,
            health: status.overallStatus,
            diagnostics,
            recentLogs: { nexus: recentLogs(), backend: backendLogs },
          }),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AppError('Empty response received from Groq AI model.', 502, 'AI_RESPONSE_EMPTY');
    }

    const parsed = JSON.parse(content);
    return {
      diagnosis: typeof parsed.diagnosis === 'string' ? parsed.diagnosis : 'Unknown incident detected',
      rootCause: typeof parsed.rootCause === 'string' ? parsed.rootCause : 'Unspecified system issue',
      repairPlan: Array.isArray(parsed.repairPlan)
        ? parsed.repairPlan.map(String)
        : ['Inspect system health', 'Run deterministic rebuild'],
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      `AI diagnosis via Groq unavailable (${error.message}). The deterministic rebuild workflow remains available.`,
      502,
      'AI_DIAGNOSIS_UNAVAILABLE'
    );
  }
}

module.exports = { analyze };
