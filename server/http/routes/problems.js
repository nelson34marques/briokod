import { Router } from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import {
  listProblems,
  countProblems,
  getProblemBySlug,
  getTestCases,
  createProblem,
  updateProblem,
} from '../../services/problems.js';
import { listSubmissionsForProblem } from '../../services/submissions.js';
import { config } from '../../config.js';

const router = Router();

/** GET /api/problems?difficulty=easy&tag=lacos&search=sort&limit=50&offset=0 */
router.get(
  '/problems',
  validate(schemas.problemList, 'query'),
  asyncHandler(async (req, res) => {
    const query = req.valid.query;
    const items = listProblems(query);
    res.json({
      items,
      pagination: {
        total: countProblems({ difficulty: query.difficulty }),
        limit: query.limit,
        offset: query.offset,
        count: items.length,
      },
    });
  }),
);

/** GET /api/problems/:slug — statement, samples, stats and starter code. */
router.get(
  '/problems/:slug',
  asyncHandler(async (req, res) => {
    const problem = getProblemBySlug(req.params.slug);
    res.json({
      ...problem,
      samples: getTestCases(problem.id, { includeHidden: false, limit: config.limits.maxTestCases }),
    });
  }),
);

/** GET /api/problems/:slug/testcases — samples only unless authenticated. */
router.get(
  '/problems/:slug/testcases',
  asyncHandler(async (req, res) => {
    const problem = getProblemBySlug(req.params.slug);
    const includeHidden = req.query.includeHidden === 'true' && Boolean(req.user);
    res.json({
      problemId: problem.id,
      slug: problem.slug,
      testCases: getTestCases(problem.id, {
        includeHidden,
        limit: config.limits.maxTestCases,
      }),
    });
  }),
);

/** GET /api/problems/:slug/submissions — recent public solutions. */
router.get(
  '/problems/:slug/submissions',
  asyncHandler(async (req, res) => {
    const problem = getProblemBySlug(req.params.slug);
    const limit = Math.min(Number.parseInt(req.query.limit ?? '20', 10) || 20, 100);
    res.json({ items: listSubmissionsForProblem(problem.id, limit) });
  }),
);

/** POST /api/problems — admin only. */
router.post(
  '/problems',
  requireAdmin,
  validate(schemas.createProblem),
  asyncHandler(async (req, res) => {
    res.status(201).json(createProblem(req.valid.body));
  }),
);

/** PATCH /api/problems/:slug — admin only. */
router.patch(
  '/problems/:slug',
  requireAdmin,
  validate(schemas.updateProblem),
  asyncHandler(async (req, res) => {
    const problem = getProblemBySlug(req.params.slug);
    res.json(updateProblem(problem.id, req.valid.body));
  }),
);

export default router;
