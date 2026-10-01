import { ZodError } from 'zod';
import { AppError, NotFoundError } from '../../lib/errors.js';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'not_found', message: `Rota não encontrada: ${req.method} ${req.path}` },
  });
}

/** Single JSON error shape for the whole API: { error: { code, message, details? } }. */
export function errorHandler(error, req, res, _next) {
  if (res.headersSent) return;

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Requisição inválida',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    if (error.status >= 500) {
      logger.error('request failed', { path: req.path, code: error.code, message: error.message });
    }
    if (error.retryAfterMs) res.set('retry-after', String(Math.ceil(error.retryAfterMs / 1000)));
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
        ...(error.executor ? { executor: error.executor } : {}),
      },
    });
    return;
  }

  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'invalid_json', message: 'Corpo da requisição não é JSON válido' } });
    return;
  }

  logger.error('unhandled error', { path: req.path, message: error?.message, stack: error?.stack });
  res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Erro interno',
      ...(config.isProduction ? {} : { debug: error?.message }),
    },
  });
}

/** Wraps async handlers so rejections reach the error middleware. */
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export { NotFoundError };
