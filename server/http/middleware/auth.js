import { verifyIdToken } from '../../lib/firebase.js';
import { getUserByUid, syncUserFromToken } from '../../services/users.js';
import { AuthError, ForbiddenError } from '../../lib/errors.js';
import { config } from '../../config.js';
import { safeEqual } from '../../lib/crypto.js';
import { logger } from '../../lib/logger.js';

function readBearer(req) {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * Firebase issues the ID token; this only mirrors it into the local profile
 * row. Verification failures are logged and treated as "anonymous" so a stale
 * token never turns into a 500 on public endpoints.
 */
export async function attachUser(req, _res, next) {
  const token = readBearer(req);
  req.user = null;

  if (token) {
    try {
      const claims = await verifyIdToken(token);
      req.user = syncUserFromToken(claims);
    } catch (error) {
      req.authError = error;
      logger.debug('token rejected', { reason: error.message });
    }
  }

  next();
}

export function requireAuth(req, _res, next) {
  if (req.user) {
    next();
    return;
  }
  if (req.authError) {
    next(new AuthError(req.authError.message));
    return;
  }
  next(new AuthError('Faça login para continuar'));
}

export function requireAdmin(req, _res, next) {
  if (config.adminKey && safeEqual(req.get('x-admin-key') ?? '', config.adminKey)) {
    req.isAdminKey = true;
    next();
    return;
  }
  if (!req.user) {
    next(new AuthError());
    return;
  }
  if (!req.user.isAdmin) {
    next(new ForbiddenError('Acesso restrito a administradores'));
    return;
  }
  next();
}

export { getUserByUid };
