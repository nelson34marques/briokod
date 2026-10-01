import { all, get, run, nowIso } from '../db/index.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';

const PUBLIC_COLUMNS = [
  'id',
  'firebase_uid',
  'username',
  'display_name',
  'photo_url',
  'provider',
  'is_admin',
  'points',
  'solved_count',
  'created_at',
  'last_seen_at',
];

/** `publicColumns('u')` -> "u.id, u.username, ..." */
function publicColumns(alias = '') {
  const prefix = alias ? `${alias}.` : '';
  return PUBLIC_COLUMNS.map((column) => `${prefix}${column}`).join(', ');
}

function toPublic(row) {
  if (!row) return null;
  return {
    id: row.id,
    uid: row.firebase_uid,
    username: row.username,
    displayName: row.display_name,
    photoURL: row.photo_url,
    provider: row.provider,
    isAdmin: row.is_admin === 1,
    points: row.points,
    solvedCount: row.solved_count,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at ?? null,
  };
}

function normaliseEmail(email) {
  return String(email ?? '').trim().toLowerCase() || null;
}

/** Derives a unique, URL-safe handle from the email local part. */
function usernameFromEmail(email, uid) {
  const local = normaliseEmail(email)?.split('@')[0] ?? 'aluno';
  const base = local.replace(/[^a-z0-9._-]/gi, '').slice(0, 20) || 'aluno';
  if (!get('SELECT id FROM users WHERE username = ?', [base])) return base;
  return `${base}-${uid.slice(0, 6)}`;
}

/**
 * Mirrors a verified Firebase ID token into the local profile row on first
 * sight, then refreshes the mutable bits. The token is the only credential; no
 * password is ever stored or compared here.
 */
export function syncUserFromToken(claims) {
  const now = nowIso();
  const email = normaliseEmail(claims.email);

  const existing = get(`SELECT ${publicColumns()} FROM users WHERE firebase_uid = ?`, [claims.uid]);
  if (existing) {
    run(
      `UPDATE users SET
         email        = COALESCE(?, email),
         display_name = COALESCE(?, display_name),
         photo_url    = COALESCE(?, photo_url),
         provider     = ?,
         is_admin     = ?,
         last_seen_at = ?
       WHERE id = ?`,
      [
        email,
        claims.displayName ?? null,
        claims.photoURL ?? null,
        claims.provider ?? 'unknown',
        claims.isAdmin ? 1 : 0,
        now,
        existing.id,
      ],
    );
    return getUserById(existing.id);
  }

  // A Google account can appear here first if the same person already used
  // e-mail/password; adopt that row instead of creating a duplicate.
  const byEmail = email ? get(`SELECT ${publicColumns()} FROM users WHERE email = ?`, [email]) : null;
  if (byEmail) {
    run(
      `UPDATE users SET firebase_uid = ?, display_name = COALESCE(?, display_name),
         photo_url = COALESCE(?, photo_url), provider = ?, is_admin = ?, last_seen_at = ?
       WHERE id = ?`,
      [
        claims.uid,
        claims.displayName ?? null,
        claims.photoURL ?? null,
        claims.provider ?? 'unknown',
        claims.isAdmin ? 1 : 0,
        now,
        byEmail.id,
      ],
    );
    return getUserById(byEmail.id);
  }

  const username = usernameFromEmail(email, claims.uid);
  const result = run(
    `INSERT INTO users
       (firebase_uid, email, username, display_name, photo_url, provider, is_admin, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      claims.uid,
      email,
      username,
      claims.displayName?.trim() || username,
      claims.photoURL ?? null,
      claims.provider ?? 'unknown',
      claims.isAdmin ? 1 : 0,
      now,
      now,
    ],
  );

  return getUserById(result.lastInsertRowid);
}

export function getUserById(id) {
  return toPublic(get(`SELECT ${publicColumns()} FROM users WHERE id = ?`, [id]));
}

export function getUserByUid(uid) {
  return toPublic(get(`SELECT ${publicColumns()} FROM users WHERE firebase_uid = ?`, [uid]));
}

export function updateProfile(userId, { displayName, photoURL }) {
  if (!displayName?.trim() && !photoURL) throw new ValidationError('Informe um nome de exibição');
  const current = getUserById(userId);
  run(
    'UPDATE users SET display_name = ?, photo_url = ? WHERE id = ?',
    [displayName?.trim() || current.displayName, photoURL ?? current.photoURL, userId],
  );
  return getUserById(userId);
}

export function touchLastSeen(userId) {
  run('UPDATE users SET last_seen_at = ? WHERE id = ?', [nowIso(), userId]);
}

export function leaderboard(limit = 10) {
  return all(
    `SELECT ${publicColumns()} FROM users
     WHERE provider != 'seed'
     ORDER BY points DESC, solved_count DESC, created_at ASC
     LIMIT ?`,
    [limit],
  ).map(toPublic);
}

export function listUsers(limit = 50, offset = 0) {
  const rows = all(
    `SELECT ${publicColumns()} FROM users WHERE provider != 'seed' ORDER BY id ASC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  const total = get("SELECT COUNT(*) AS n FROM users WHERE provider != 'seed'").n;
  return { items: rows.map(toPublic), total, limit, offset };
}

export function countUsers() {
  return get('SELECT COUNT(*) AS n FROM users').n;
}

export function requireUser(userId) {
  const user = getUserById(userId);
  if (!user) throw new NotFoundError('Usuário não encontrado');
  return user;
}

export { toPublic };
