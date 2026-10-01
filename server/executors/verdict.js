/** Canonical verdicts shared by every executor and by the client. */
export const VERDICT = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  ACCEPTED: 'accepted',
  WRONG_ANSWER: 'wrong_answer',
  TIME_LIMIT_EXCEEDED: 'time_limit_exceeded',
  COMPILE_ERROR: 'compile_error',
  RUNTIME_ERROR: 'runtime_error',
  OUTPUT_LIMIT: 'output_limit',
  INTERNAL_ERROR: 'internal_error',
  UNAVAILABLE: 'unavailable',
};

export const TERMINAL_VERDICTS = new Set([
  VERDICT.ACCEPTED,
  VERDICT.WRONG_ANSWER,
  VERDICT.TIME_LIMIT_EXCEEDED,
  VERDICT.COMPILE_ERROR,
  VERDICT.RUNTIME_ERROR,
  VERDICT.OUTPUT_LIMIT,
  VERDICT.INTERNAL_ERROR,
  VERDICT.UNAVAILABLE,
]);

export const VERDICT_LABELS = {
  [VERDICT.QUEUED]: 'Na fila',
  [VERDICT.PROCESSING]: 'Executando',
  [VERDICT.ACCEPTED]: 'Correto',
  [VERDICT.WRONG_ANSWER]: 'Resposta errada',
  [VERDICT.TIME_LIMIT_EXCEEDED]: 'Tempo excedido',
  [VERDICT.COMPILE_ERROR]: 'Erro de compilação',
  [VERDICT.RUNTIME_ERROR]: 'Erro de execução',
  [VERDICT.OUTPUT_LIMIT]: 'Saída muito grande',
  [VERDICT.INTERNAL_ERROR]: 'Erro interno',
  [VERDICT.UNAVAILABLE]: 'Executor indisponível',
};

/** Judge0 status_id -> verdict (1..14). */
const JUDGE0_VERDICTS = {
  1: VERDICT.QUEUED,
  2: VERDICT.PROCESSING,
  3: VERDICT.ACCEPTED,
  4: VERDICT.WRONG_ANSWER,
  5: VERDICT.TIME_LIMIT_EXCEEDED,
  6: VERDICT.COMPILE_ERROR,
  7: VERDICT.RUNTIME_ERROR,
  8: VERDICT.RUNTIME_ERROR,
  9: VERDICT.RUNTIME_ERROR,
  10: VERDICT.RUNTIME_ERROR,
  11: VERDICT.RUNTIME_ERROR,
  12: VERDICT.RUNTIME_ERROR,
  13: VERDICT.INTERNAL_ERROR,
  14: VERDICT.RUNTIME_ERROR,
};

export function verdictFromJudge0(statusId) {
  return JUDGE0_VERDICTS[statusId] ?? VERDICT.INTERNAL_ERROR;
}

/** Piston run/compile `status` (null = success) plus exit code. */
export function verdictFromPiston(stage) {
  if (!stage) return VERDICT.INTERNAL_ERROR;
  switch (stage.status) {
    case null:
    case undefined:
      return stage.code === 0 ? VERDICT.ACCEPTED : VERDICT.RUNTIME_ERROR;
    case 'TO':
      return VERDICT.TIME_LIMIT_EXCEEDED;
    case 'OL':
    case 'EL':
      return VERDICT.OUTPUT_LIMIT;
    case 'SG':
    case 'RE':
      return VERDICT.RUNTIME_ERROR;
    case 'XX':
      return VERDICT.INTERNAL_ERROR;
    default:
      return VERDICT.RUNTIME_ERROR;
  }
}

/**
 * Judge-style output comparison: normalizes whitespace, line endings,
 * numeric formatting, and accepts any output that matches token-by-token.
 */
export function normalizeOutput(text) {
  if (typeof text !== 'string') return '';
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .replace(/\n+$/, '');
}

export function compareOutput(actual, expected) {
  const normalizedActual = normalizeOutput(actual ?? '');
  const normalizedExpected = normalizeOutput(expected ?? '');

  const exactMatch = normalizedActual === normalizedExpected;
  if (exactMatch) {
    return { passed: true, normalizedActual, normalizedExpected };
  }

  const tokensActual = normalizedActual.split(/\s+/).filter(Boolean);
  const tokensExpected = normalizedExpected.split(/\s+/).filter(Boolean);

  if (tokensActual.length !== tokensExpected.length) {
    return { passed: false, normalizedActual, normalizedExpected };
  }

  const tokenMatch = tokensActual.every((token, i) => {
    if (token === tokensExpected[i]) return true;
    const numActual = Number(token);
    const numExpected = Number(tokensExpected[i]);
    if (!Number.isNaN(numActual) && !Number.isNaN(numExpected)) {
      return Math.abs(numActual - numExpected) < 1e-9;
    }
    return false;
  });

  return {
    passed: tokenMatch,
    normalizedActual,
    normalizedExpected,
  };
}

export function truncate(text, maxChars) {
  if (typeof text !== 'string') return null;
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n… (saída truncada em ${maxChars} caracteres)`;
}

export function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}
