import { Router } from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import { getUserById, updateProfile, leaderboard, listUsers } from '../../services/users.js';
import { listSubmissionsForUser } from '../../services/submissions.js';

const router = Router();

/**
 * Identity is handled entirely by Firebase Auth — there is no register/login
 * route here on purpose. The client sends `Authorization: Bearer <idToken>` and
 * `attachUser` has already mirrored it into a local row.
 */

/** GET /api/users/me */
router.get(
  '/users/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: getUserById(req.user.id) });
  }),
);

/** PATCH /api/users/me */
router.patch(
  '/users/me',
  requireAuth,
  validate(schemas.updateProfile),
  asyncHandler(async (req, res) => {
    res.json({ user: updateProfile(req.user.id, req.valid.body) });
  }),
);

/** GET /api/users/me/submissions */
router.get(
  '/users/me/submissions',
  requireAuth,
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { limit, offset } = req.valid.query;
    res.json({ items: listSubmissionsForUser(req.user.id, limit, offset) });
  }),
);

/** GET /api/users/leaderboard?limit=10 — powers the ranking table. */
router.get(
  '/users/leaderboard',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? '10', 10) || 10, 1), 100);
    res.json({ items: leaderboard(limit) });
  }),
);

/** GET /api/users — admin only. */
router.get(
  '/users',
  requireAuth,
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user.isAdmin) {
      res.status(403).json({ error: { code: 'forbidden', message: 'Acesso restrito a administradores' } });
      return;
    }
    const { limit, offset } = req.valid.query;
    res.json(listUsers(limit, offset));
  }),
);

export default router;
