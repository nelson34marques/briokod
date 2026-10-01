import { Router } from 'express';
import { config } from '../../config.js';
import { validate, schemas } from '../middleware/validate.js';
import { executeLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/errors.js';
import { handleSubmission } from '../../services/runner.js';
import { getProblemBySlug } from '../../services/problems.js';
import { ValidationError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const router = Router();

/**
 * POST /api/execute — the single entry point for running code.
 *
 * mode=run    executes once and returns raw output (the "Run" button)
 * mode=judge  replays the problem's test cases and returns a verdict
 *
 * The response shape is identical for every executor, which is what lets the
 * platform swap Judge0 for Piston (or vice versa) without touching the client.
 */
router.post(
  '/execute',
  executeLimiter,
  validate(schemas.execute),
  asyncHandler(async (req, res) => {
    const input = req.valid.body;
    const startedAt = performance.now();

    let problem = null;
    if (input.problem) {
      problem = getProblemBySlug(input.problem);
    }
    if (input.mode === 'judge' && !problem) {
      throw new ValidationError('O modo "judge" exige o campo "problem" com o slug do problema');
    }

    const deadlineMs =
      input.mode === 'judge'
        ? Math.min(config.executorTimeoutMs * 2, 120000)
        : config.executorTimeoutMs;

    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(new Error('deadline')), deadlineMs);
    res.on('close', () => {
      if (!res.writableEnded) controller.abort(new Error('client disconnected'));
    });

    try {
      const result = await handleSubmission({
        mode: input.mode,
        language: input.language,
        sourceCode: input.sourceCode,
        stdin: input.stdin,
        problem,
        user: req.user,
        clientIp: req.ip ?? null,
        signal: controller.signal,
      });

      logger.info('execute request', {
        mode: input.mode,
        language: input.language,
        problem: problem?.slug ?? null,
        verdict: result.verdict,
        ms: Math.round(performance.now() - startedAt),
      });

      res.json(result);
    } finally {
      clearTimeout(deadline);
    }
  }),
);

export default router;
