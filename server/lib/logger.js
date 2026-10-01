import process from 'node:process';
import { config } from '../config.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = LEVELS[config.env === 'production' ? 'info' : 'debug'] ?? 2;

function stamp() {
  return new Date().toISOString();
}

function emit(level, message, meta) {
  if ((LEVELS[level] ?? 2) > threshold) return;
  const line = `${stamp()} ${level.toUpperCase().padEnd(5)} ${message}`;
  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  stream.write(meta === undefined ? `${line}\n` : `${line} ${JSON.stringify(meta)}\n`);
}

export const logger = {
  error: (message, meta) => emit('error', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  info: (message, meta) => emit('info', message, meta),
  debug: (message, meta) => emit('debug', message, meta),
};
