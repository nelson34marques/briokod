import { all, get, run, nowIso } from '../db/index.js';
import { config } from '../config.js';
import { VERDICT } from '../executors/verdict.js';

/**
 * Quanto o aluno recebe por um problema, dado quantas vezes errou antes.
 *
 * Errar não tira ponto já conquistado: desconta do valor que o acerto renderia.
 * O desconto é proporcional ao problema (um erro em um problema de 300 pontos
 * pesa mais que em um de 100) e tem teto, para a recompensa não chegar a zero
 * só por insistência.
 */
export function rewardFor(basePoints, wrongAttempts) {
  const base = Math.max(0, Math.round(basePoints));
  if (wrongAttempts <= 0) return { points: base, penalty: 0 };

  const { wrongAttemptRatio, penaltyCapRatio } = config.scoring;
  const cap = Math.round(base * penaltyCapRatio);
  const penalty = Math.min(cap, Math.round(base * wrongAttemptRatio * wrongAttempts));

  return { points: base - penalty, penalty };
}

/** Tentativas erradas do aluno neste problema, anteriores a `beforeId`. */
export function countWrongAttempts(userId, problemId, beforeId, clientIp = null) {
  if (userId) {
    const row = get(
      `SELECT COUNT(*) AS n FROM submissions
       WHERE user_id = ? AND problem_id = ? AND verdict != ? AND id < ?`,
      [userId, problemId, VERDICT.ACCEPTED, beforeId],
    );
    return row?.n ?? 0;
  }
  if (clientIp) {
    const row = get(
      `SELECT COUNT(*) AS n FROM submissions
       WHERE user_id IS NULL AND client_ip = ? AND problem_id = ? AND verdict != ? AND id < ?`,
      [clientIp, problemId, VERDICT.ACCEPTED, beforeId],
    );
    return row?.n ?? 0;
  }
  return 0;
}

/** Recompensa que o aluno leva agora se acertar este problema. */
export function currentReward(userId, problem, clientIp = null) {
  if (!problem) return { points: 0, penalty: 0, wrongAttempts: 0 };
  const wrongAttempts = countWrongAttempts(userId, problem.id, Infinity, clientIp);
  return { ...rewardFor(problem.points, wrongAttempts), wrongAttempts };
}

function toPublic(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username ?? null,
    problemId: row.problem_id,
    problemSlug: row.problem_slug ?? null,
    mode: row.mode,
    language: row.language,
    executor: row.executor,
    verdict: row.verdict,
    statusId: row.status_id,
    statusDescription: row.status_description,
    stdout: row.stdout,
    stderr: row.stderr,
    compileOutput: row.compile_output,
    message: row.message,
    timeMs: row.time_ms,
    memoryKb: row.memory_kb,
    exitCode: row.exit_code,
    sourceCode: row.source_code,
    casesPassed: row.cases_passed,
    casesTotal: row.cases_total,
    durationMs: row.duration_ms,
    pointsAwarded: row.points_awarded,
    penaltyApplied: row.penalty_applied,
    createdAt: row.created_at,
  };
}

const SELECT_WITH_USER = `
  SELECT s.*, u.username AS username, p.slug AS problem_slug
  FROM submissions s
  LEFT JOIN users u ON u.id = s.user_id
  LEFT JOIN problems p ON p.id = s.problem_id
`;

export function recordSubmission(entry) {
  // O prêmio é resolvido antes do insert: só faz sentido na primeira submissão
  // aceita de um problema, e o insert precisa gravar o valor awarded.
  const problem = entry.problemId ? get('SELECT points FROM problems WHERE id = ?', [entry.problemId]) : null;
  const isFirstAccept =
    Boolean(entry.userId) &&
    entry.verdict === VERDICT.ACCEPTED &&
    Boolean(entry.problemId) &&
    !get('SELECT 1 AS x FROM submissions WHERE user_id = ? AND problem_id = ? AND verdict = ?', [
      entry.userId,
      entry.problemId,
      VERDICT.ACCEPTED,
    ]);

  const { points: awardedPoints, penalty } = isFirstAccept
    ? rewardFor(problem?.points ?? 100, countWrongAttempts(entry.userId, entry.problemId, Infinity, entry.clientIp))
    : { points: 0, penalty: 0 };

  const result = run(
    `INSERT INTO submissions
       (user_id, problem_id, mode, language, executor, verdict, status_id, status_description,
        stdout, stderr, compile_output, message, time_ms, memory_kb, exit_code, source_code,
        source_bytes, cases_passed, cases_total, remote_token, duration_ms, client_ip, created_at,
        points_awarded, penalty_applied)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.userId ?? null,
      entry.problemId ?? null,
      entry.mode,
      entry.language,
      entry.executor,
      entry.verdict,
      entry.statusId ?? null,
      entry.statusDescription ?? null,
      entry.stdout ?? null,
      entry.stderr ?? null,
      entry.compileOutput ?? null,
      entry.message ?? null,
      entry.timeMs ?? null,
      entry.memoryKb ?? null,
      entry.exitCode ?? null,
      entry.sourceCode ?? null,
      entry.sourceCode ? Buffer.byteLength(entry.sourceCode, 'utf8') : 0,
      entry.casesPassed ?? null,
      entry.casesTotal ?? null,
      entry.remoteToken ?? null,
      entry.durationMs ?? 0,
      entry.clientIp ?? null,
      nowIso(),
      awardedPoints || null,
      penalty,
    ],
  );

  // Accepted answers move the leaderboard forward exactly once per submission.
  if (isFirstAccept) {
    run('UPDATE users SET points = points + ?, solved_count = solved_count + 1 WHERE id = ?', [
      awardedPoints,
      entry.userId,
    ]);
  }

  return { id: result.lastInsertRowid, pointsAwarded: awardedPoints, penalty };
}

export function getSubmission(id) {
  return toPublic(get(`${SELECT_WITH_USER} WHERE s.id = ?`, [id]));
}

export function listSubmissionsForUser(userId, limit = 20, offset = 0) {
  return all(`${SELECT_WITH_USER} WHERE s.user_id = ? ORDER BY s.id DESC LIMIT ? OFFSET ?`, [
    userId,
    limit,
    offset,
  ]).map(toPublic);
}

export function listRecentSubmissions(limit = 20) {
  return all(`${SELECT_WITH_USER} ORDER BY s.id DESC LIMIT ?`, [limit]).map(toPublic);
}

export function listSubmissionsForProblem(problemId, limit = 20) {
  return all(`${SELECT_WITH_USER} WHERE s.problem_id = ? ORDER BY s.id DESC LIMIT ?`, [
    problemId,
    limit,
  ]).map(toPublic);
}

/** Counters powering the "volume" section of the scale documentation. */
export function submissionMetrics(sinceMinutes = 60) {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();
  const totals = get(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN verdict = 'accepted' THEN 1 ELSE 0 END) AS accepted,
            AVG(duration_ms) AS avg_duration_ms
     FROM submissions WHERE created_at >= ?`,
    [since],
  );
  const perMinute = all(
    `SELECT substr(created_at, 1, 16) AS minute, COUNT(*) AS n
     FROM submissions WHERE created_at >= ?
     GROUP BY minute ORDER BY minute ASC`,
    [since],
  );
  return { windowMinutes: sinceMinutes, ...totals, perMinute };
}
