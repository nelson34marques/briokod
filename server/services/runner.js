import { config } from '../config.js';
import { execute, VERDICT_LABELS } from '../executors/index.js';
import { VERDICT, compareOutput, TERMINAL_VERDICTS } from '../executors/verdict.js';
import { getLanguage } from '../executors/languages.js';
import { deriveLimits, getTestCases } from './problems.js';
import { currentReward, recordSubmission } from './submissions.js';
import { nowIso } from '../db/index.js';
import { ValidationError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

/** NUL and other C0 control characters break Judge0's UTF-8 handling. */
// oxlint-disable-next-line no-control-regex -- C0 chars are exactly what we reject here
const FORBIDDEN_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

function assertSource(sourceCode) {
  const bytes = Buffer.byteLength(sourceCode, 'utf8');
  if (bytes === 0) throw new ValidationError('O código não pode estar vazio');
  if (bytes > config.limits.maxSourceBytes) {
    throw new ValidationError(
      `O código excede o limite de ${config.limits.maxSourceBytes} bytes (enviado: ${bytes})`,
    );
  }
  if (FORBIDDEN_CHARS.test(sourceCode)) {
    throw new ValidationError('O código contém caracteres de controle não permitidos');
  }
}

function assertStdin(stdin) {
  const bytes = Buffer.byteLength(stdin ?? '', 'utf8');
  if (bytes > config.limits.maxStdinBytes) {
    throw new ValidationError(`A entrada padrão excede o limite de ${config.limits.maxStdinBytes} bytes`);
  }
}

function baseResponse(result, { startedAt }) {
  return {
    verdict: result.verdict,
    verdictLabel: VERDICT_LABELS[result.verdict] ?? result.verdict,
    statusId: result.statusId,
    statusDescription: result.statusDescription,
    stdout: result.stdout,
    stderr: result.stderr,
    compileOutput: result.compileOutput,
    message: result.message,
    exitCode: result.exitCode,
    timeMs: result.timeMs,
    memoryKb: result.memoryKb,
    executor: result.executor,
    simulated: Boolean(result.simulated),
    token: result.token,
    submitMs: result.submitMs ?? null,
    executorMs: result.totalMs,
    totalMs: Math.round(performance.now() - startedAt),
    failover: result.attempts ?? [],
  };
}

/** Single execution: "Run". No expected output, verdict reflects only crashes. */
export async function runOnce({ language, sourceCode, stdin = '', problem = null, signal }) {
  const startedAt = performance.now();
  const spec = getLanguage(language);
  if (!spec) throw new ValidationError(`Linguagem não suportada: ${language}`);

  assertSource(sourceCode);
  assertStdin(stdin);

  const limits = deriveLimits(problem);
  const result = await execute({ language, sourceCode, stdin, limits }, { signal });

  return {
    ...baseResponse(result, { startedAt }),
    mode: 'run',
    limits,
  };
}

/**
 * Judge mode: replays the submission against the problem's test cases and
 * compares locally, so every executor produces byte-identical verdicts.
 */
export async function judge({ language, sourceCode, problem, signal }) {
  const startedAt = performance.now();
  const spec = getLanguage(language);
  if (!spec) throw new ValidationError(`Linguagem não suportada: ${language}`);

  assertSource(sourceCode);

  const limits = deriveLimits(problem);
  const cases = getTestCases(problem.id, { includeHidden: true, limit: config.limits.maxJudgeCases });

  if (cases.length === 0) {
    throw new ValidationError('Este problema ainda não tem casos de teste');
  }

  const results = [];
  let worstTimeMs = 0;
  let peakMemoryKb = 0;
  let hardFailure = null;

  for (const testCase of cases) {
    assertStdin(testCase.stdin);
    const result = await execute(
      { language, sourceCode, stdin: testCase.stdin, limits },
      { signal },
    );

    const comparison = compareOutput(result.stdout ?? '', testCase.expected);
    const passed = comparison.passed && result.verdict === VERDICT.ACCEPTED;
    worstTimeMs = Math.max(worstTimeMs, result.timeMs ?? 0);
    peakMemoryKb = Math.max(peakMemoryKb, result.memoryKb ?? 0);

    results.push({
      case: testCase.position + 1,
      isSample: testCase.isSample,
      passed,
      verdict: result.verdict,
      timeMs: result.timeMs,
      memoryKb: result.memoryKb,
      expected: testCase.isSample ? comparison.normalizedExpected : null,
      actual: comparison.normalizedActual.slice(0, 2000),
      stdout: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compileOutput,
      message: result.message,
    });

    // A compile error or crash will not fix itself on the next case.
    if (
      hardFailure === null &&
      [VERDICT.COMPILE_ERROR, VERDICT.RUNTIME_ERROR, VERDICT.INTERNAL_ERROR, VERDICT.UNAVAILABLE].includes(
        result.verdict,
      )
    ) {
      hardFailure = result;
    }
    if (signal?.aborted) break;
  }

  const passed = results.filter((entry) => entry.passed).length;
  const total = results.length;
  const anyHardFailure = hardFailure !== null;
  const timedOut = results.some((entry) => entry.verdict === VERDICT.TIME_LIMIT_EXCEEDED);

  const verdict = anyHardFailure
    ? (hardFailure.verdict === VERDICT.UNAVAILABLE ? VERDICT.UNAVAILABLE : hardFailure.verdict)
    : timedOut
      ? VERDICT.TIME_LIMIT_EXCEEDED
      : passed === total
        ? VERDICT.ACCEPTED
        : VERDICT.WRONG_ANSWER;

  return {
    verdict,
    verdictLabel: VERDICT_LABELS[verdict] ?? verdict,
    statusId: hardFailure?.statusId ?? null,
    statusDescription: hardFailure?.statusDescription ?? null,
    stdout: results[0]?.stdout ?? null,
    stderr: results.find((entry) => entry.stderr)?.stderr ?? null,
    compileOutput: results.find((entry) => entry.compileOutput)?.compileOutput ?? null,
    message: hardFailure?.message ?? null,
    exitCode: hardFailure?.exitCode ?? null,
    timeMs: worstTimeMs || null,
    memoryKb: peakMemoryKb || null,
    executor: results[0]?.executor ?? hardFailure?.executor ?? null,
    simulated: results[0]?.simulated ?? hardFailure?.simulated ?? false,
    token: hardFailure?.token ?? null,
    submitMs: null,
    executorMs: hardFailure?.totalMs ?? null,
    totalMs: Math.round(performance.now() - startedAt),
    failover: hardFailure?.attempts ?? [],
    mode: 'judge',
    casesPassed: passed,
    casesTotal: total,
    testCases: results.map(({ stdout, stderr: _stderr, compileOutput: _compileOutput, ...rest }) => ({
      ...rest,
      output: truncateForClient(stdout),
    })),
    limits,
  };
}

function truncateForClient(text) {
  if (typeof text !== 'string') return null;
  return text.length > 4000 ? `${text.slice(0, 4000)}\n…` : text;
}

/** Single entry point used by the route: runs, judges and persists. */
export async function handleSubmission({ mode, language, sourceCode, stdin, problem, user, clientIp, signal }) {
  const outcome =
    mode === 'judge'
      ? await judge({ language, sourceCode, problem, signal })
      : await runOnce({ language, sourceCode, stdin, problem, signal });

  const submission = recordSubmission({
    userId: user?.id ?? null,
    problemId: problem?.id ?? null,
    mode,
    language,
    executor: outcome.executor ?? 'none',
    verdict: outcome.verdict,
    statusId: outcome.statusId,
    statusDescription: outcome.statusDescription,
    stdout: outcome.stdout,
    stderr: outcome.stderr,
    compileOutput: outcome.compileOutput,
    message: outcome.message,
    timeMs: outcome.timeMs,
    memoryKb: outcome.memoryKb,
    exitCode: outcome.exitCode,
    sourceCode,
    casesPassed: outcome.casesPassed ?? null,
    casesTotal: outcome.casesTotal ?? null,
    remoteToken: outcome.token ?? null,
    durationMs: outcome.totalMs,
    clientIp,
  });

  // O prêmio antes da tentativa: é o que o aluno ainda ganha se acertar agora.
  // No acerto, o que ele levou de fato. Nos dois casos a UI tem o número certo.
  const reward = currentReward(user?.id ?? null, problem, clientIp);

  logger.info('submission stored', {
    submissionId: submission.id,
    mode,
    verdict: outcome.verdict,
    pointsAwarded: submission.pointsAwarded,
    at: nowIso(),
  });

  return {
    id: submission.id,
    problem: problem
      ? { id: problem.id, slug: problem.slug, title: problem.title, points: problem.points }
      : null,
    language,
    scoring: {
      basePoints: problem?.points ?? 0,
      pointsAwarded: submission.pointsAwarded,
      penaltyApplied: submission.penalty,
      penaltyPending: reward.penalty,
      rewardIfAccepted: outcome.verdict === VERDICT.ACCEPTED ? submission.pointsAwarded : reward.points,
      wrongAttempts: reward.wrongAttempts,
    },
    ...outcome,
  };
}

export { TERMINAL_VERDICTS };
