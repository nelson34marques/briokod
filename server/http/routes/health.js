import os from 'node:os';
import { Router } from 'express';
import { asyncHandler } from '../middleware/errors.js';
import { health, describe } from '../../executors/index.js';
import { listLanguages } from '../../executors/languages.js';
import { submissionMetrics, listRecentSubmissions } from '../../services/submissions.js';
import { get } from '../../db/index.js';
import { config, publicConfig } from '../../config.js';

const router = Router();
const bootedAt = Date.now();

/** GET /api/health — liveness plus a real probe of every executor. */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const executors = await health();
    let database = { ok: true };
    try {
      get('SELECT 1');
    } catch (error) {
      database = { ok: false, error: error.message };
    }

    const payload = {
      status: executors.healthy && database.ok ? 'ok' : 'degraded',
      uptimeSeconds: Math.round((Date.now() - bootedAt) / 1000),
      version: '1.0.0',
      env: config.env,
      node: process.version,
      platform: `${os.platform()}-${os.arch()}`,
      cpus: os.cpus().length,
      loadAverage: os.loadavg().map((value) => Number(value.toFixed(2))),
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      database,
      executors: executors.executors,
      primaryExecutor: executors.primary,
      config: publicConfig(),
    };

    res.status(payload.status === 'ok' ? 200 : 503).json(payload);
  }),
);

/** GET /api/executors — the configured failover chain, without probing. */
router.get('/executors', (_req, res) => {
  res.json({ chain: describe(), languages: listLanguages() });
});

/** GET /api/metrics?minutes=60 — submission volume, for capacity planning. */
router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    const minutes = Math.min(Math.max(Number.parseInt(req.query.minutes ?? '60', 10) || 60, 1), 1440);
    res.json({
      submissions: submissionMetrics(minutes),
      recent: listRecentSubmissions(10),
    });
  }),
);

export default router;
