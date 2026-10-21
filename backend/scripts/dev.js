// Keep local development separate from the Dockerized Nexus API on port 5000.
process.env.PORT = process.env.DEV_PORT || '5001';
require('../server');
