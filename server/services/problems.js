import { all, get, run, nowIso } from '../db/index.js';
import { NotFoundError, ConflictError } from '../lib/errors.js';

const MAX_CPU_TIME_LIMIT = 15;
const MAX_WALL_TIME_LIMIT = 20;
const MAX_MEMORY_LIMIT_KB = 512000;
const MAX_FILE_SIZE_KB = 4096;

function parseTags(value) {
  try {
    const parsed = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Clamps user/problem supplied limits to what an executor can actually honour. */
export function deriveLimits(problem) {
  const cpuSeconds = problem ? Math.round(problem.time_limit_ms / 1000) : 2;
  const boundedCpu = Math.min(Math.max(cpuSeconds, 1), MAX_CPU_TIME_LIMIT);
  return {
    cpuTimeLimit: boundedCpu,
    wallTimeLimit: Math.min(Math.max(boundedCpu * 2 + 1, 2), MAX_WALL_TIME_LIMIT),
    memoryLimitKb: Math.min(problem?.memory_limit_kb ?? 128000, MAX_MEMORY_LIMIT_KB),
    maxFileSizeKb: Math.min(problem?.max_file_size_kb ?? 1024, MAX_FILE_SIZE_KB),
  };
}

function withStats(problem) {
  const stats = get(
    `SELECT
       COUNT(*)                                                   AS submissions,
       SUM(CASE WHEN verdict = 'accepted' THEN 1 ELSE 0 END)       AS accepted,
       COUNT(DISTINCT CASE WHEN verdict = 'accepted' THEN user_id END) AS solvers
     FROM submissions WHERE problem_id = ?`,
    [problem.id],
  );
  return {
    ...problem,
    tags: parseTags(problem.tags),
    starterCode: JSON.parse(problem.starter_code || '{}'),
    stats: {
      submissions: stats?.submissions ?? 0,
      accepted: stats?.accepted ?? 0,
      solvers: stats?.solvers ?? 0,
    },
  };
}

export function listProblems({ difficulty, tag, search, limit = 50, offset = 0 } = {}) {
  const where = [];
  const params = [];

  if (difficulty) {
    where.push('difficulty = ?');
    params.push(difficulty);
  }
  if (search) {
    where.push('(title LIKE ? OR statement LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (tag) {
    where.push('tags LIKE ?');
    params.push(`%"${tag}"%`);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = all(
    `SELECT * FROM problems ${clause} ORDER BY points ASC, id ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const filtered = tag ? rows.filter((row) => parseTags(row.tags).includes(tag)) : rows;
  return filtered.map(withStats);
}

export function countProblems({ difficulty } = {}) {
  const clause = difficulty ? 'WHERE difficulty = ?' : '';
  const params = difficulty ? [difficulty] : [];
  return get(`SELECT COUNT(*) AS n FROM problems ${clause}`, params).n;
}

export function getProblemBySlug(slug) {
  const row = get('SELECT * FROM problems WHERE slug = ?', [slug]);
  if (!row) throw new NotFoundError(`Problema "${slug}" não encontrado`);
  return withStats(row);
}

export function getProblemById(id) {
  const row = get('SELECT * FROM problems WHERE id = ?', [id]);
  if (!row) throw new NotFoundError(`Problema #${id} não encontrado`);
  return withStats(row);
}

/**
 * Test cases for judging. `includeHidden` gates the non-sample cases, which is
 * what keeps a competitive platform honest.
 */
export function getTestCases(problemId, { includeHidden = false, limit = 12 } = {}) {
  const clause = includeHidden ? '' : 'AND is_sample = 1';
  const rows = all(
    `SELECT position, stdin, expected, is_sample FROM test_cases
     WHERE problem_id = ? ${clause}
     ORDER BY is_sample DESC, position ASC LIMIT ?`,
    [problemId, limit],
  );
  return rows.map((row) => ({
    position: row.position,
    stdin: row.stdin,
    expected: row.expected,
    isSample: row.is_sample === 1,
  }));
}

export function createProblem(input) {
  const now = nowIso();
  if (get('SELECT id FROM problems WHERE slug = ?', [input.slug])) {
    throw new ConflictError(`Já existe um problema com o slug "${input.slug}"`);
  }
  const result = run(
    `INSERT INTO problems
       (slug, title, statement, difficulty, tags, time_limit_ms, memory_limit_kb,
        max_file_size_kb, starter_code, points, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.slug,
      input.title,
      input.statement,
      input.difficulty,
      JSON.stringify(input.tags ?? []),
      input.timeLimitMs ?? 5000,
      input.memoryLimitKb ?? 128000,
      input.maxFileSizeKb ?? 1024,
      JSON.stringify(input.starterCode ?? {}),
      input.points ?? 100,
      now,
      now,
    ],
  );

  (input.testCases ?? []).forEach((testCase, index) => {
    run('INSERT INTO test_cases (problem_id, position, stdin, expected, is_sample) VALUES (?, ?, ?, ?, ?)', [
      result.lastInsertRowid,
      index,
      testCase.stdin ?? '',
      testCase.expected ?? '',
      testCase.isSample ? 1 : 0,
    ]);
  });

  return getProblemById(result.lastInsertRowid);
}

export function updateProblem(id, input) {
  const existing = getProblemById(id);
  const now = nowIso();
  run(
    `UPDATE problems SET
       title = ?, statement = ?, difficulty = ?, tags = ?, time_limit_ms = ?,
       memory_limit_kb = ?, max_file_size_kb = ?, starter_code = ?, points = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.title ?? existing.title,
      input.statement ?? existing.statement,
      input.difficulty ?? existing.difficulty,
      JSON.stringify(input.tags ?? existing.tags),
      input.timeLimitMs ?? existing.time_limit_ms,
      input.memoryLimitKb ?? existing.memory_limit_kb,
      input.maxFileSizeKb ?? existing.max_file_size_kb,
      JSON.stringify(input.starterCode ?? existing.starterCode),
      input.points ?? existing.points,
      now,
      id,
    ],
  );
  return getProblemById(id);
}
