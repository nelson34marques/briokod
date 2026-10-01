import { pathToFileURL } from 'node:url';
import { db } from './index.js';
import { logger } from '../lib/logger.js';

/**
 * Ordered, append-only migrations. Each entry runs exactly once and is recorded
 * in schema_migrations. Never edit a shipped migration — add a new one.
 */
const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    up: `
      CREATE TABLE users (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        email          TEXT    NOT NULL UNIQUE,
        username       TEXT    NOT NULL UNIQUE,
        display_name   TEXT    NOT NULL,
        password_hash  TEXT    NOT NULL,
        is_admin       INTEGER NOT NULL DEFAULT 0,
        points         INTEGER NOT NULL DEFAULT 0,
        solved_count   INTEGER NOT NULL DEFAULT 0,
        created_at     TEXT    NOT NULL,
        last_seen_at   TEXT
      );

      CREATE TABLE sessions (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT    NOT NULL UNIQUE,
        created_at TEXT    NOT NULL,
        expires_at TEXT    NOT NULL,
        user_agent TEXT,
        ip         TEXT
      );
      CREATE INDEX idx_sessions_user    ON sessions(user_id);
      CREATE INDEX idx_sessions_expires ON sessions(expires_at);

      CREATE TABLE problems (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        slug              TEXT    NOT NULL UNIQUE,
        title             TEXT    NOT NULL,
        statement         TEXT    NOT NULL,
        difficulty        TEXT    NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
        tags              TEXT    NOT NULL DEFAULT '[]',
        time_limit_ms     INTEGER NOT NULL DEFAULT 5000,
        memory_limit_kb   INTEGER NOT NULL DEFAULT 128000,
        max_file_size_kb  INTEGER NOT NULL DEFAULT 1024,
        starter_code      TEXT    NOT NULL DEFAULT '{}',
        function_name     TEXT,
        points            INTEGER NOT NULL DEFAULT 100,
        created_at        TEXT    NOT NULL,
        updated_at        TEXT    NOT NULL
      );
      CREATE INDEX idx_problems_difficulty ON problems(difficulty);

      CREATE TABLE test_cases (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
        position   INTEGER NOT NULL,
        stdin      TEXT    NOT NULL DEFAULT '',
        expected   TEXT    NOT NULL DEFAULT '',
        is_sample  INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_test_cases_problem ON test_cases(problem_id, position);

      CREATE TABLE submissions (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
        problem_id        INTEGER REFERENCES problems(id) ON DELETE SET NULL,
        mode              TEXT    NOT NULL,
        language          TEXT    NOT NULL,
        executor          TEXT    NOT NULL,
        verdict           TEXT    NOT NULL,
        status_id         INTEGER,
        status_description TEXT,
        stdout            TEXT,
        stderr            TEXT,
        compile_output    TEXT,
        message           TEXT,
        time_ms           REAL,
        memory_kb         INTEGER,
        exit_code         INTEGER,
        source_code       TEXT,
        source_bytes      INTEGER NOT NULL DEFAULT 0,
        cases_passed      INTEGER,
        cases_total       INTEGER,
        remote_token      TEXT,
        duration_ms       INTEGER NOT NULL DEFAULT 0,
        client_ip         TEXT,
        created_at        TEXT    NOT NULL
      );
      CREATE INDEX idx_submissions_user    ON submissions(user_id, created_at DESC);
      CREATE INDEX idx_submissions_problem ON submissions(problem_id, created_at DESC);
      CREATE INDEX idx_submissions_created ON submissions(created_at DESC);
    `,
  },
  {
    // Firebase Auth took over identity: the users row is now keyed by the
    // Firebase uid, passwords and server-issued sessions are gone.
    version: 2,
    name: 'firebase_identity',
    up: `
      CREATE TABLE users_new (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid  TEXT    UNIQUE,
        email         TEXT    UNIQUE,
        username      TEXT    UNIQUE,
        display_name  TEXT    NOT NULL,
        photo_url     TEXT,
        provider      TEXT,
        is_admin      INTEGER NOT NULL DEFAULT 0,
        points        INTEGER NOT NULL DEFAULT 0,
        solved_count  INTEGER NOT NULL DEFAULT 0,
        created_at    TEXT    NOT NULL,
        last_seen_at  TEXT
      );

      INSERT INTO users_new
        (id, email, username, display_name, is_admin, points, solved_count, created_at, last_seen_at)
      SELECT id, email, username, display_name, is_admin, points, solved_count, created_at, last_seen_at
      FROM users;

      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;

      CREATE UNIQUE INDEX idx_users_firebase_uid ON users(firebase_uid);
      CREATE INDEX idx_users_ranking ON users(points DESC, solved_count DESC);

      DROP TABLE sessions;
    `,
  },
  {
    // Errar desconta do prêmio do acerto, então a submissão precisa guardar
    // quanto valeu na prática — o valor do problema sozinho não conta a história.
    version: 3,
    name: 'submission_penalty',
    up: `
      ALTER TABLE submissions ADD COLUMN points_awarded INTEGER;
      ALTER TABLE submissions ADD COLUMN penalty_applied INTEGER NOT NULL DEFAULT 0;

      -- O desconto é contado por tentativa errada anterior ao acerto; este
      -- índice torna essa contagem barata.
      CREATE INDEX idx_submissions_user_problem ON submissions(user_id, problem_id, verdict, id);
    `,
  },
];

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map((row) => row.version),
  );

  let count = 0;
  // Table rebuilds (see migration 2) need FK enforcement off, and the pragma is
  // a no-op inside a transaction — so it is toggled around the loop.
  db.exec('PRAGMA foreign_keys = OFF');
  try {
    for (const migration of migrations) {
      if (applied.has(migration.version)) continue;
      db.exec('BEGIN');
      try {
        db.exec(migration.up);
        db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
          migration.version,
          migration.name,
          new Date().toISOString(),
        );
        db.exec('COMMIT');
        count += 1;
        logger.info('migration applied', { version: migration.version, name: migration.name });
      } catch (error) {
        db.exec('ROLLBACK');
        throw new Error(`migration ${migration.version} (${migration.name}) failed: ${error.message}`);
      }
    }
  } finally {
    db.exec('PRAGMA foreign_keys = ON');
  }

  return count;
}

// Executado via `npm run db:migrate`. Sem este bloco o script só importava o
// módulo e saía — a migração nunca rodava, em silêncio.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const count = migrate();
    logger.info('migrations up to date', { applied: count });
  } catch (error) {
    logger.error('migration failed', { error: error.message });
    process.exitCode = 1;
  }
}
