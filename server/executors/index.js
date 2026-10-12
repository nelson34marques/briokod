import { config } from '../config.js';
import { logger } from '../lib/logger.js';
import { ExecutorError } from '../lib/errors.js';
import { createJudge0Executor } from './judge0.js';
import { createPistonExecutor } from './piston.js';
import { createMockExecutor } from './mock.js';

const FACTORIES = {
  'judge0-local': () =>
    createJudge0Executor({
      name: 'judge0-local',
      baseUrl: config.judge0.localUrl,
      authToken: config.judge0.authToken,
    }),
  'judge0-ce': () => createJudge0Executor({ name: 'judge0-ce', baseUrl: config.judge0.ceUrl }),
  piston: () => createPistonExecutor(),
  mock: () => createMockExecutor(),
};

const EXECUTOR_LABELS = {
  'judge0-local': 'Judge0 CE local (Docker)',
  'judge0-ce': 'Judge0 CE público',
  piston: 'Piston',
  mock: 'Simulado (node:vm)',
};

function createBreaker() {
  return {
    state: 'closed',
    consecutiveFailures: 0,
    openedAt: 0,
    calls: 0,
    failures: 0,
    lastLatencyMs: null,
    lastError: null,
    lastSuccessAt: null,
  };
}

const breakers = new Map();
const instances = new Map();

function instance(name) {
  if (!instances.has(name)) {
    const factory = FACTORIES[name];
    if (!factory) return null;
    instances.set(name, factory());
    breakers.set(name, createBreaker());
    logger.info('executor registered', { name, baseUrl: instances.get(name).baseUrl });
  }
  return instances.get(name);
}

/** Names from EXECUTORS that we actually know how to build. */
export const chain = config.executors.filter((name) => {
  if (Object.hasOwn(FACTORIES, name)) return true;
  logger.warn('unknown executor in EXECUTORS, ignoring', { name });
  return false;
});

// O mock entra sempre como último recurso: garante que o JS corre e que uma
// linguagem sem executor devolve "indisponível" (200) em vez de um 502.
if (!chain.includes('mock')) {
  chain.push('mock');
  logger.warn('mock não está em EXECUTORS, a acrescentar como último recurso');
}

function breaker(name) {
  if (!breakers.has(name)) instance(name);
  return breakers.get(name);
}

function isOpen(name) {
  const state = breaker(name);
  if (state.state !== 'open') return false;
  if (Date.now() - state.openedAt >= config.circuitCooldownMs) {
    state.state = 'half-open';
    logger.info('circuit half-open', { name });
    return false;
  }
  return true;
}

function recordSuccess(name, latencyMs) {
  const state = breaker(name);
  state.calls += 1;
  state.consecutiveFailures = 0;
  state.state = 'closed';
  state.lastLatencyMs = latencyMs;
  state.lastError = null;
  state.lastSuccessAt = new Date().toISOString();
}

function recordFailure(name, error) {
  const state = breaker(name);
  state.calls += 1;
  state.failures += 1;
  state.consecutiveFailures += 1;
  state.lastError = error.message;
  if (state.state === 'half-open' || state.consecutiveFailures >= config.circuitFailureThreshold) {
    state.state = 'open';
    state.openedAt = Date.now();
    logger.warn('circuit opened', { name, failures: state.consecutiveFailures, error: error.message });
  }
}

/**
 * Runs a submission against the first healthy executor in the chain, failing
 * over to the next one on transport errors, timeouts and saturated queues.
 */
export async function execute(request, { signal } = {}) {
  const attempts = [];

  for (const name of chain) {
    const executor = instance(name);
    if (!executor) continue;

    if (isOpen(name)) {
      attempts.push({ executor: name, outcome: 'skipped', reason: 'circuit_open' });
      continue;
    }

    try {
      const result = await executor.run(request, { signal });
      recordSuccess(name, result.totalMs);
      logger.info('execution finished', {
        executor: name,
        verdict: result.verdict,
        totalMs: result.totalMs,
        failovers: attempts.length,
      });
      return { ...result, attempts };
    } catch (error) {
      const wrapped =
        error instanceof ExecutorError
          ? error
          : new ExecutorError(`executor ${name} falhou: ${error.message}`, { executor: name, cause: error });
      recordFailure(name, wrapped);
      attempts.push({ executor: name, outcome: 'failed', reason: wrapped.message });
      logger.warn('executor failed, trying next', { executor: name, error: wrapped.message });
    }
  }

  throw new ExecutorError('Nenhum executor disponível para executar a submissão', {
    details: { attempts },
  });
}

export async function health() {
  const entries = await Promise.all(
    chain.map(async (name) => {
      const executor = instance(name);
      const state = breaker(name);
      try {
        const probe = await executor.health();
        return {
          name,
          label: EXECUTOR_LABELS[name] ?? name,
          kind: executor.kind,
          baseUrl: executor.baseUrl,
          simulated: Boolean(executor.simulated),
          reachable: probe.ok,
          status: probe.status,
          latencyMs: probe.latencyMs,
          circuit: state.state,
          consecutiveFailures: state.consecutiveFailures,
          calls: state.calls,
          failures: state.failures,
          lastError: state.lastError,
          detail: probe.detail ?? null,
        };
      } catch (error) {
        return {
          name,
          label: EXECUTOR_LABELS[name] ?? name,
          kind: executor.kind,
          baseUrl: executor.baseUrl,
          simulated: Boolean(executor.simulated),
          reachable: false,
          status: null,
          latencyMs: null,
          circuit: state.state,
          consecutiveFailures: state.consecutiveFailures,
          calls: state.calls,
          failures: state.failures,
          lastError: error.message,
          detail: null,
        };
      }
    }),
  );

  return {
    executors: entries,
    healthy: entries.some((entry) => entry.reachable),
    primary: entries.find((entry) => entry.reachable)?.name ?? null,
  };
}

export function describe() {
  return chain.map((name) => {
    const executor = instance(name);
    const state = breaker(name);
    return {
      name,
      label: EXECUTOR_LABELS[name] ?? name,
      kind: executor.kind,
      baseUrl: executor.baseUrl,
      simulated: Boolean(executor.simulated),
      circuit: state.state,
    };
  });
}

export { VERDICT_LABELS } from './verdict.js';
export { listLanguages } from './languages.js';
