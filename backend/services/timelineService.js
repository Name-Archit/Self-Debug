const logger = require('../utils/logger');

const events = [];
let eventIdCounter = 1;

function addEvent(event) {
  const entry = {
    id: eventIdCounter++,
    timestamp: new Date().toISOString(),
    event,
  };

  events.unshift(entry);
  if (events.length > 200) {
    events.pop();
  }

  logger.info('Timeline event recorded', { event });
  return entry;
}

function getEvents(limit = 50) {
  return events.slice(0, limit);
}

function getEventsByType(type) {
  return events.filter((e) => e.type === type);
}

module.exports = {
  addEvent,
  getEvents,
  getEventsByType,
};
