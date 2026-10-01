export class AppError extends Error {
  constructor(message, { status = 500, code = 'internal_error', details, cause } = {}) {
    super(message, { cause });
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, { status: 400, code: 'validation_error', details });
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'Autenticação necessária') {
    super(message, { status: 401, code: 'unauthorized' });
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Permissão negada') {
    super(message, { status: 403, code: 'forbidden' });
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, { status: 404, code: 'not_found' });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message, details) {
    super(message, { status: 409, code: 'conflict', details });
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message, retryAfterMs) {
    super(message, { status: 429, code: 'rate_limited' });
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class ExecutorError extends AppError {
  constructor(message, { executor, cause, retryable = true } = {}) {
    super(message, { status: 502, code: 'executor_error', cause });
    this.name = 'ExecutorError';
    this.executor = executor;
    this.retryable = retryable;
  }
}
