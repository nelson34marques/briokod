import { Worker } from 'node:worker_threads';
import { config } from '../config.js';
import { VERDICT, truncate } from './verdict.js';

const workerUrl = new URL('./js-worker.mjs', import.meta.url);

function runJavaScript({ sourceCode, stdin, timeoutMs }) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate().catch(() => {});
      resolve(value);
    };

    const worker = new Worker(workerUrl, {
      workerData: { sourceCode, stdin, timeoutMs },
      resourceLimits: { maxOldGenerationSizeMb: 128 },
    });

    const timer = setTimeout(
      () => finish({ ok: false, timedOut: true, exitCode: null, stdout: '', stderr: `Tempo limite de ${timeoutMs}ms excedido`, timeMs: timeoutMs }),
      timeoutMs + 750,
    );

    worker.once('message', (message) => finish(message));
    worker.once('error', (error) =>
      finish({ ok: false, timedOut: false, exitCode: 1, stdout: '', stderr: error.message, timeMs: null }),
    );
    worker.once('exit', (code) => {
      if (!settled) {
        finish({
          ok: false,
          timedOut: false,
          exitCode: code,
          stdout: '',
          stderr: `Executor simulado encerrado com código ${code}`,
          timeMs: null,
        });
      }
    });
  });
}

/**
 * Last-resort executor so the platform is never dead in the water.
 *
 * It is honest about what it is: JavaScript really is executed, inside a
 * `node:vm` context on a worker thread with a hard timeout. Every other language
 * is refused with an explicit `unavailable` verdict instead of a fake result.
 */
export function createMockExecutor({ name = 'mock' } = {}) {
  return {
    name,
    kind: 'mock',
    simulated: true,
    baseUrl: null,

    async health() {
      return { ok: true, status: 200, latencyMs: 0, detail: { mode: 'simulated', languages: ['javascript'] } };
    },

    async run({ language, sourceCode, stdin = '', limits, signal }) {
      const startedAt = performance.now();

      if (language !== 'javascript') {
        return {
          executor: name,
          token: null,
          verdict: VERDICT.UNAVAILABLE,
          statusId: null,
          statusDescription: `Executor simulado não executa ${language}`,
          stdout: null,
          stderr: null,
          compileOutput: null,
          message:
            'Esta linguagem precisa de um executor externo. Tente novamente em instantes ou fale com o suporte.',
          exitCode: null,
          exitSignal: null,
          timeMs: null,
          wallTimeMs: null,
          memoryKb: null,
          submitMs: 0,
          totalMs: Math.round(performance.now() - startedAt),
        };
      }

      const cpuBudget = Math.max(250, Math.min(limits.cpuTimeLimit, limits.wallTimeLimit));
      const result = await runJavaScript({ sourceCode, stdin, timeoutMs: cpuBudget });
      if (signal?.aborted) {
        return {
          executor: name,
          token: null,
          verdict: VERDICT.INTERNAL_ERROR,
          statusId: null,
          statusDescription: 'Cancelado',
          stdout: null,
          stderr: null,
          compileOutput: null,
          message: 'Execução cancelada',
          exitCode: null,
          exitSignal: null,
          timeMs: null,
          wallTimeMs: null,
          memoryKb: null,
          submitMs: 0,
          totalMs: Math.round(performance.now() - startedAt),
        };
      }

      return {
        executor: name,
        token: null,
        verdict: result.timedOut
          ? VERDICT.TIME_LIMIT_EXCEEDED
          : result.ok
            ? VERDICT.ACCEPTED
            : result.stderr?.includes('SyntaxError')
              ? VERDICT.COMPILE_ERROR
              : VERDICT.RUNTIME_ERROR,
        statusId: null,
        statusDescription: result.timedOut ? 'Tempo Limite Excedido' : null,
        stdout: truncate(result.stdout ?? '', config.limits.maxOutputChars),
        stderr: truncate(result.stderr || null, config.limits.maxOutputChars),
        compileOutput: null,
        message: null,
        exitCode: result.exitCode ?? null,
        exitSignal: null,
        timeMs: result.timeMs === null ? null : Math.round(result.timeMs * 1000) / 1000,
        wallTimeMs: result.timeMs === null ? null : Math.round(result.timeMs),
        memoryKb: null,
        submitMs: 0,
        totalMs: Math.round(performance.now() - startedAt),
        simulated: true,
      };
    },
  };
}
