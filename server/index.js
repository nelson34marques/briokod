import './load-env.js';
import process from 'node:process';
import { config } from './config.js';
import { createApp } from './app.js';
import { migrate } from './db/migrate.js';
import { seed } from './db/seed.js';
import { closeDb } from './db/index.js';
import { describe } from './executors/index.js';
import { logger } from './lib/logger.js';

const applied = migrate();
const seeded = seed();

const app = createApp();
const server = app.listen(config.port, config.host, () => {
  logger.info(`BrioKod API ouvindo em http://${config.host}:${config.port}`, {
    migrationsApplied: applied,
    seeded: seeded.skipped ? 'already populated' : seeded,
    executors: describe().map((entry) => `${entry.name}${entry.simulated ? ' (simulado)' : ''}`),
  });
});

server.headersTimeout = 65000;
server.requestTimeout = 130000;

let closing = false;
function shutdown(signal) {
  if (closing) return;
  closing = true;
  logger.info('shutting down', { signal });
  server.close(() => {
    closeDb();
    logger.info('shutdown complete');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 8000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection', { reason: String(reason) });
});
