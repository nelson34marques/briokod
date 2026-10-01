import { RateLimitError } from '../../lib/errors.js';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';

/**
 * Fixed-window limiter kept in process memory. Horizontal scaling moves this to
 * Redis later; the interface (`hit`) is what the route depends on, so swapping
 * the backing store is a one-file change.
 */
const buckets = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref();

function clientKey(req) {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

export function createRateLimiter({ name, limit, windowMs = config.rateLimit.windowMs }) {
  return (req, _res, next) => {
    const key = `${name}:${clientKey(req)}:${req.user?.id ?? 'anon'}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > limit) {
      const retryAfterMs = bucket.resetAt - now;
      logger.warn('rate limit hit', { limiter: name, key, retryAfterMs });
      next(new RateLimitError(`Limite de ${limit} requisições por ${Math.round(windowMs / 1000)}s excedido`, retryAfterMs));
      return;
    }

    next();
  };
}

export const globalLimiter = createRateLimiter({
  name: 'global',
  limit: config.rateLimit.maxRequests,
});

export const executeLimiter = createRateLimiter({
  name: 'execute',
  limit: config.rateLimit.maxExecutes,
});
