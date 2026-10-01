import { parentPort, workerData } from 'node:worker_threads';
import vm from 'node:vm';

const { sourceCode, stdin, timeoutMs } = workerData;

const stdout = [];
const stderr = [];

function format(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack ?? value.message;
  try {
    return JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? String(item) : item));
  } catch {
    return String(value);
  }
}

const sandbox = {
  stdin: stdin ?? '',
  console: {
    log: (...args) => stdout.push(args.map(format).join(' ')),
    info: (...args) => stdout.push(args.map(format).join(' ')),
    debug: (...args) => stdout.push(args.map(format).join(' ')),
    warn: (...args) => stderr.push(args.map(format).join(' ')),
    error: (...args) => stderr.push(args.map(format).join(' ')),
  },
  // Minimal CommonJS shim: enough for the seeded starter code, and explicit
  // about everything that is not available in the simulated environment.
  require: (id) => {
    if (id === 'node:fs' || id === 'fs') {
      return {
        readFileSync: (target) => (target === 0 || target === '0' ? (stdin ?? '') : ''),
        writeFileSync: () => undefined,
        existsSync: () => false,
      };
    }
    if (id === 'node:path' || id === 'path') {
      return { join: (...parts) => parts.join('/'), resolve: (...parts) => parts.join('/') };
    }
    if (id === 'node:util' || id === 'util') {
      return { inspect: format };
    }
    throw new Error(`Módulo indisponível no executor simulado: ${id}`);
  },
  module: { exports: {} },
  exports: {},
  __filename: 'main.js',
  __dirname: '/',
  Buffer,
  URL,
  TextEncoder,
  TextDecoder,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  queueMicrotask,
  structuredClone,
  process: { argv: ['main.js'], env: {}, platform: 'linux', version: 'v20.0.0' },
  input: () => {
    const raw = (stdin ?? '').trim();
    return raw.length > 0 ? raw.split(/\s+/) : [];
  },
  JSON,
  Math,
  Date,
  Promise,
  Array,
  Object,
  String,
  Number,
  Boolean,
  Map,
  Set,
  RegExp,
  Error,
  TypeError,
  RangeError,
  SyntaxError,
};

const startedAt = performance.now();

try {
  const script = new vm.Script(sourceCode, { filename: 'main.js' });
  script.runInNewContext(sandbox, { timeout: timeoutMs, displayErrors: true });
  parentPort.postMessage({
    ok: true,
    exitCode: 0,
    stdout: stdout.join('\n'),
    stderr: stderr.join('\n'),
    timeMs: performance.now() - startedAt,
  });
} catch (error) {
  const timedOut = error?.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT';
  parentPort.postMessage({
    ok: false,
    timedOut,
    exitCode: 1,
    stdout: stdout.join('\n'),
    stderr: timedOut ? `Tempo limite de ${timeoutMs}ms excedido` : (error?.stack ?? String(error)),
    timeMs: performance.now() - startedAt,
  });
}
