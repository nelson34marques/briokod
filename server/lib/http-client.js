import { ExecutorError } from './errors.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch() with a hard timeout, bounded retries on transient failures and
 * normalised error reporting. Never throws on HTTP status: the caller decides.
 */
export async function request(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 10000,
    retries = 0,
    retryDelayMs = 250,
    label = 'http',
    signal: outerSignal,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
    const onAbort = () => controller.abort(outerSignal.reason);
    if (outerSignal) {
      if (outerSignal.aborted) onAbort();
      else outerSignal.addEventListener('abort', onAbort, { once: true });
    }

    const startedAt = performance.now();
    try {
      const response = await fetch(url, {
        method,
        headers: {
          accept: 'application/json',
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      const text = await response.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text.slice(0, 2000) };
        }
      }

      return {
        ok: response.ok,
        status: response.status,
        headers: response.headers,
        data,
        elapsedMs: Math.round(performance.now() - startedAt),
        attempts: attempt + 1,
      };
    } catch (cause) {
      lastError = cause;
      const aborted = controller.signal.aborted && !outerSignal?.aborted;
      if (!aborted && attempt < retries) {
        await sleep(retryDelayMs * 2 ** attempt);
        continue;
      }
      throw new ExecutorError(
        aborted ? `${label} timed out after ${timeoutMs}ms` : `${label} request failed: ${cause.message}`,
        { cause, executor: label },
      );
    } finally {
      clearTimeout(timer);
      if (outerSignal) outerSignal.removeEventListener('abort', onAbort);
    }
  }

  throw new ExecutorError(`${label} request failed`, { cause: lastError, executor: label });
}

export function describeHttpFailure(result, label) {
  const detail =
    result?.data?.error ??
    (Array.isArray(result?.data)
      ? result.data.map((d) => d?.error).filter(Boolean).join('; ')
      : null) ??
    result?.data?.message ??
    (result?.data ? JSON.stringify(result.data).slice(0, 300) : null);

  return `${label} responded ${result?.status ?? 'no response'}${detail ? `: ${detail}` : ''}`;
}
