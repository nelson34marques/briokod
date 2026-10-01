import { config } from '../config.js';
import { request, describeHttpFailure } from '../lib/http-client.js';
import { ExecutorError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { getLanguage } from './languages.js';
import { verdictFromJudge0, toNumber, truncate } from './verdict.js';

const RESULT_FIELDS = [
  'token',
  'status',
  'stdout',
  'stderr',
  'compile_output',
  'message',
  'time',
  'wall_time',
  'memory',
  'exit_code',
  'exit_signal',
].join(',');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Adapter for any Judge0 CE instance (self-hosted via Docker Compose or the
 * public CE host). Async submit + poll is used on purpose: Judge0's `wait=true`
 * runs the sandbox inline in the web thread and does not scale.
 */
export function createJudge0Executor({ name, baseUrl, authToken = '' }) {
  const languageCache = new Map();
  let languagesFetchedAt = 0;

  function authHeaders() {
    return authToken ? { 'X-Auth-Token': authToken } : {};
  }

  /** Resolves a language slug to a Judge0 id, preferring the newest runtime. */
  async function resolveLanguageId(slug) {
    const language = getLanguage(slug);
    if (!language) throw new ExecutorError(`Linguagem não suportada: ${slug}`, { executor: name });

    const cached = languageCache.get(slug);
    if (cached && Date.now() - languagesFetchedAt < config.judge0.languageCacheMs) return cached;

    const result = await request(`${baseUrl}/languages`, {
      headers: authHeaders(),
      timeoutMs: 5000,
      retries: 1,
      label: `${name}:/languages`,
    });

    if (result.ok && Array.isArray(result.data)) {
      const candidates = result.data
        .filter((entry) => !entry.is_archived && language.judge0.pattern.test(entry.name))
        .map((entry) => ({ id: entry.id, parts: versionTuple(entry.name) }))
        .sort((a, b) => compareTuples(b.parts, a.parts) || a.id - b.id);

      if (candidates.length > 0) {
        languagesFetchedAt = Date.now();
        languageCache.set(slug, candidates[0].id);
        logger.debug('judge0 language resolved', { executor: name, slug, id: candidates[0].id });
        return candidates[0].id;
      }
      logger.warn('judge0 has no runtime matching pattern', { executor: name, slug });
    }

    return language.judge0.fallbackId;
  }

  async function submit({ slug, sourceCode, stdin, limits, signal }) {
    const languageId = await resolveLanguageId(slug);

    const body = {
      source_code: sourceCode,
      language_id: languageId,
      cpu_time_limit: Math.max(1, Math.round(limits.cpuTimeLimit)),
      wall_time_limit: Math.max(2, Math.round(limits.wallTimeLimit)),
      memory_limit: limits.memoryLimitKb,
      max_file_size: limits.maxFileSizeKb,
      enable_network: false,
    };
    if (stdin) body.stdin = stdin;

    const result = await request(`${baseUrl}/submissions?base64_encoded=false&wait=false&fields=token,status`, {
      method: 'POST',
      headers: authHeaders(),
      body,
      timeoutMs: 10000,
      retries: 0,
      label: `${name}:submit`,
      signal,
    });

    if (result.status === 503) {
      throw new ExecutorError(describeHttpFailure(result, `${name} queue`), {
        executor: name,
        retryable: true,
      });
    }
    if (!result.ok || !result.data?.token) {
      throw new ExecutorError(describeHttpFailure(result, `${name} submit`), { executor: name });
    }

    return { token: result.data.token, languageId, submitMs: result.elapsedMs };
  }

  async function poll(token, signal) {
    for (let attempt = 0; attempt < config.pollMaxAttempts; attempt += 1) {
      if (signal?.aborted) throw new ExecutorError('Execução cancelada', { executor: name });

      const result = await request(
        `${baseUrl}/submissions/${token}?base64_encoded=true&fields=${RESULT_FIELDS}`,
        { headers: authHeaders(), timeoutMs: 8000, retries: 1, label: `${name}:poll`, signal },
      );

      if (result.status === 404) {
        throw new ExecutorError(`${name} desconheceu o token ${token}`, { executor: name, retryable: false });
      }
      if (!result.ok || !result.data?.status) {
        throw new ExecutorError(describeHttpFailure(result, `${name} poll`), { executor: name });
      }

      const statusId = result.data.status.id;
      if (statusId > 2) return { ...result.data, statusId };
      await sleep(config.pollIntervalMs);
    }

    throw new ExecutorError(
      `${name} não concluiu em ${config.pollMaxAttempts * config.pollIntervalMs}ms`,
      { executor: name },
    );
  }

  return {
    name,
    kind: 'judge0',
    baseUrl,

    async health() {
      const result = await request(`${baseUrl}/system_info`, {
        headers: authHeaders(),
        timeoutMs: 4000,
        label: `${name}:system_info`,
      });
      return {
        ok: result.ok,
        status: result.status,
        latencyMs: result.elapsedMs ?? null,
        detail: result.ok ? { cpus: result.data?.cpus, memory: result.data?.memory } : null,
      };
    },

    async run({ language, sourceCode, stdin = '', limits, signal }) {
      const startedAt = performance.now();
      const { token, submitMs } = await submit({ slug: language, sourceCode, stdin, limits, signal });
      const data = await poll(token, signal);

      const decode = (value) => {
        if (!value) return value;
        try {
          return Buffer.from(value, 'base64').toString('utf8');
        } catch {
          return value;
        }
      };

      return {
        executor: name,
        token,
        verdict: verdictFromJudge0(data.statusId),
        statusId: data.statusId,
        statusDescription: data.status?.description ?? null,
        stdout: truncate(decode(data.stdout) ?? '', config.limits.maxOutputChars),
        stderr: truncate(decode(data.stderr) ?? '', config.limits.maxOutputChars),
        compileOutput: truncate(decode(data.compile_output) ?? null, config.limits.maxOutputChars),
        message: truncate(decode(data.message) ?? null, 2000),
        exitCode: data.exit_code ?? null,
        exitSignal: data.exit_signal ?? null,
        timeMs: toNumber(data.time),
        wallTimeMs: toNumber(data.wall_time),
        memoryKb: toNumber(data.memory),
        submitMs,
        totalMs: Math.round(performance.now() - startedAt),
      };
    },
  };
}

/** "Python (3.11.2)" -> [3, 11, 2] for order-safe comparison. */
function versionTuple(name) {
  const match = name.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return [0, 0, 0];
  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
}

function compareTuples(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}
