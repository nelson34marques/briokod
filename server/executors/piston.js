import { config } from '../config.js';
import { request, describeHttpFailure } from '../lib/http-client.js';
import { ExecutorError } from '../lib/errors.js';
import { getLanguage } from './languages.js';
import { verdictFromPiston, truncate, VERDICT } from './verdict.js';

/**
 * Adapter for Piston. Piston is fully synchronous — there is no token to poll
 * and no queue behind it — so this adapter blocks for the whole run, bounded by
 * the shared executor timeout.
 */
export function createPistonExecutor({ name = 'piston', url, apiKey, apiKeyHeader } = {}) {
  const baseUrl = url ?? config.piston.url;
  const key = apiKey ?? config.piston.apiKey;
  const keyHeader = apiKeyHeader ?? config.piston.apiKeyHeader;
  const executePath = config.piston.executePath;
  const runtimesPath = config.piston.runtimesPath;

  function headers() {
    return key ? { [keyHeader]: key } : {};
  }

  return {
    name,
    kind: 'piston',
    baseUrl,

    async health() {
      const result = await request(`${baseUrl}${runtimesPath}`, {
        headers: headers(),
        timeoutMs: 4000,
        label: `${name}:runtimes`,
      });
      return {
        ok: result.ok,
        status: result.status,
        latencyMs: result.elapsedMs ?? null,
        detail: result.ok
          ? { runtimes: Array.isArray(result.data) ? result.data.length : null }
          : { message: result.data?.message ?? null },
      };
    },

    async run({ language, sourceCode, stdin = '', limits, signal }) {
      const spec = getLanguage(language);
      if (!spec?.piston) throw new ExecutorError(`Piston não suporta ${language}`, { executor: name });

      const startedAt = performance.now();
      const result = await request(`${baseUrl}${executePath}`, {
        method: 'POST',
        headers: headers(),
        body: {
          language: spec.piston.language,
          version: config.piston.version,
          files: [{ name: spec.piston.file, content: sourceCode }],
          stdin,
          compile_timeout: limits.wallTimeLimit * 1000,
          run_timeout: limits.wallTimeLimit * 1000,
        },
        timeoutMs: config.executorTimeoutMs,
        retries: 0,
        label: `${name}:execute`,
        signal,
      });

      if (!result.ok) {
        throw new ExecutorError(describeHttpFailure(result, `${name} execute`), { executor: name });
      }

      const compile = result.data?.compile ?? null;
      const run = result.data?.run ?? null;
      if (!run) throw new ExecutorError(`${name} não retornou resultado de execução`, { executor: name });

      const compileFailed = Boolean(compile) && (compile.status !== null || compile.code !== 0);
      const verdict = compileFailed ? VERDICT.COMPILE_ERROR : verdictFromPiston(run);

      return {
        executor: name,
        token: null,
        verdict,
        statusId: null,
        statusDescription: run.message ?? compile?.message ?? null,
        stdout: truncate(run.stdout ?? '', config.limits.maxOutputChars),
        stderr: truncate(run.stderr ?? '', config.limits.maxOutputChars),
        compileOutput: truncate(compileFailed ? (compile.output ?? compile.stderr) : null, config.limits.maxOutputChars),
        message: truncate(verdict === VERDICT.INTERNAL_ERROR ? run.message : null, 2000),
        exitCode: run.code ?? null,
        exitSignal: run.signal ?? null,
        timeMs: typeof run.cpu_time === 'number' ? run.cpu_time : null,
        wallTimeMs: typeof run.wall_time === 'number' ? run.wall_time : null,
        memoryKb: typeof run.memory === 'number' ? Math.round(run.memory / 1024) : null,
        submitMs: 0,
        totalMs: Math.round(performance.now() - startedAt),
      };
    },
  };
}
