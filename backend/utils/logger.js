const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'nexus.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function writeToFile(entry) {
  const line = `${JSON.stringify(entry)}\n`;
  fs.appendFile(LOG_FILE, line, () => {});
}

function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const consoleLine = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
  if (level === 'error') {
    console.error(consoleLine, meta.details || '');
  } else {
    console.log(consoleLine);
  }

  writeToFile(entry);
}

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  debug: (message, meta) => log('debug', message, meta),
};
