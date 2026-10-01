import express from 'express';
import cors from 'cors';
import { config, isLocalNetworkOrigin } from './config.js';
import { logger } from './lib/logger.js';
import { attachUser } from './http/middleware/auth.js';
import { globalLimiter } from './http/middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './http/middleware/errors.js';
import executeRoutes from './http/routes/execute.js';
import problemRoutes from './http/routes/problems.js';
import roomRoutes from './http/routes/rooms.js';
import userRoutes from './http/routes/users.js';
import healthRoutes from './http/routes/health.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.isProduction ? 1 : false);
  app.set('etag', false);

  // Baseline security headers. The API serves JSON only, so nothing here needs
  // to accommodate inline scripts or framing.
  app.use((_req, res, next) => {
    res.set({
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
      'cross-origin-resource-policy': 'same-site',
    });
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (config.corsOrigin.includes('*') || config.corsOrigin.includes(origin)) {
          callback(null, true);
          return;
        }
        // Development: aceita o telemóvel na mesma rede (http://192.168.x.x:5173).
        if (config.allowLocalNetworkOrigins && isLocalNetworkOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(attachUser);

  app.use('/api', globalLimiter);

  app.get('/', (_req, res) => {
    res.json({
      name: 'BrioKod API',
      version: '1.0.0',
      docs: '/api/health',
      endpoints: [
        'POST   /api/execute',
        'GET    /api/rooms',
        'POST   /api/rooms',
        'POST   /api/rooms/join',
        'DELETE /api/rooms/:roomId',
        'GET    /api/rooms/:roomId',
        'POST   /api/rooms/:roomId/submissions',
        'GET    /api/problems',
        'GET    /api/problems/:slug',
        'GET    /api/problems/:slug/testcases',
        'GET    /api/problems/:slug/submissions',
        'POST   /api/problems           (admin)',
        'PATCH  /api/problems/:slug     (admin)',
        'POST   /api/users',
        'POST   /api/users/login',
        'POST   /api/users/logout',
        'GET    /api/users/me',
        'PATCH  /api/users/me',
        'GET    /api/users/me/submissions',
        'GET    /api/users/leaderboard',
        'GET    /api/health',
        'GET    /api/executors',
        'GET    /api/metrics',
      ],
    });
  });

  app.use('/api', executeRoutes);
  app.use('/api', problemRoutes);
  app.use('/api', roomRoutes);
  app.use('/api', userRoutes);
  app.use('/api', healthRoutes);

  app.use(notFoundHandler);
  app.use((error, req, res, next) => {
    if (error?.message?.startsWith('Origem não permitida')) {
      res.status(403).json({ error: { code: 'cors_forbidden', message: error.message } });
      return;
    }
    errorHandler(error, req, res, next);
  });

  logger.info('app configured', {
    env: config.env,
    executors: config.executors,
    corsOrigin: config.corsOrigin,
  });

  return app;
}
