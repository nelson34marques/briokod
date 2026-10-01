import path from 'node:path';
import process from 'node:process';

const env = process.env;

function str(key, fallback) {
  const value = env[key];
  return value === undefined || value === '' ? fallback : value;
}

function int(key, fallback) {
  const raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer for ${key}: "${raw}"`);
  }
  return parsed;
}

function float(key, fallback) {
  const raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseFloat(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for ${key}: "${raw}"`);
  }
  return parsed;
}

function bool(key, fallback) {
  const raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function list(key, fallback) {
  const raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  return String(raw)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const rootDir = path.resolve(import.meta.dirname, '..');

/**
 * Aceita origens da rede local em desenvolvimento para que a app possa ser
 * testada no telemóvel (`http://192.168.x.x:5173`) sem configurar o CORS a cada
 * vez que o router muda de IP. Só_PRIVATE nunca chega à produção: lá a lista
 * CORS_ORIGIN é a única fonte de verdade.
 */
function isLocalNetworkOrigin(origin) {
  if (typeof origin !== 'string') return false;

  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.hostname === 'localhost' || url.hostname === '::1' || url.hostname === '[::1]') return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(url.hostname);
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map(Number);
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }

  // Nomes de rede locais, tipo "mac-mini.local" em que o Vite também responde.
  return url.hostname.endsWith('.local');
}

export const config = {
  env: str('NODE_ENV', 'development'),
  isProduction: str('NODE_ENV', 'development') === 'production',
  host: str('HOST', '127.0.0.1'),
  port: int('PORT', 3000),
  rootDir,
  corsOrigin: list('CORS_ORIGIN', ['http://localhost:5173', 'http://127.0.0.1:5173']),

  // Rede local (telemóvel na mesma wifi) em desenvolvimento; desligado em produção.
  allowLocalNetworkOrigins: bool(
    'CORS_ALLOW_LOCAL_NETWORK',
    str('NODE_ENV', 'development') !== 'production',
  ),

  databasePath: path.resolve(rootDir, str('DATABASE_PATH', 'data/briokod.db')),
  databaseVerbose: bool('DATABASE_VERBOSE', false),

  // Ordered failover chain. First healthy executor wins.
  executors: list('EXECUTORS', ['mock', 'judge0-local', 'judge0-ce']),
  executorTimeoutMs: int('EXECUTOR_TIMEOUT_MS', 15000),
  pollIntervalMs: int('POLL_INTERVAL_MS', 200),
  pollMaxAttempts: int('POLL_MAX_ATTEMPTS', 60),
  circuitFailureThreshold: int('CIRCUIT_FAILURE_THRESHOLD', 3),
  circuitCooldownMs: int('CIRCUIT_COOLDOWN_MS', 20000),

  judge0: {
    localUrl: str('JUDGE0_LOCAL_URL', 'http://localhost:2358').replace(/\/+$/, ''),
    ceUrl: str('JUDGE0_CE_URL', 'https://ce.judge0.com').replace(/\/+$/, ''),
    authToken: str('JUDGE0_AUTH_TOKEN', ''),
    languageCacheMs: int('JUDGE0_LANGUAGE_CACHE_MS', 600000),
  },

  /**
   * Errar não tira o que já foi ganho: desconta do prêmio que o acerto do
   * mesmo problema vai render. Cada tentativa errada custa uma fração do valor
   * do problema, e a desconto tem teto para o prêmio nunca chegar a zero.
   *
   * Com os padrões: 1 erro -> 85% do valor, 2 -> 70%, 3 -> 55%, 4+ -> 40%.
   */
  scoring: {
    wrongAttemptRatio: float('SCORING_WRONG_ATTEMPT_RATIO', 0.15),
    penaltyCapRatio: float('SCORING_PENALTY_CAP_RATIO', 0.6),
  },

  piston: {
    url: str('PISTON_URL', 'http://localhost:2000').replace(/\/+$/, ''),
    // Self-hosted Piston serves /api/v2/execute; the hosted instance uses
    // /api/v2/piston/execute and requires an API key.
    executePath: str('PISTON_EXECUTE_PATH', '/api/v2/execute'),
    runtimesPath: str('PISTON_RUNTIMES_PATH', '/api/v2/runtimes'),
    apiKey: str('PISTON_API_KEY', ''),
    apiKeyHeader: str('PISTON_API_KEY_HEADER', 'x-api-key'),
    version: str('PISTON_VERSION', '*'),
  },

  limits: {
    maxSourceBytes: int('MAX_SOURCE_BYTES', 65536),
    maxStdinBytes: int('MAX_STDIN_BYTES', 16384),
    maxTestCases: int('MAX_TEST_CASES', 12),
    maxJudgeCases: int('MAX_JUDGE_CASES', 8),
    maxOutputChars: int('MAX_OUTPUT_CHARS', 20000),
  },

  rateLimit: {
    windowMs: int('RATE_LIMIT_WINDOW_MS', 60000),
    maxRequests: int('RATE_LIMIT_MAX_REQUESTS', 300),
    maxExecutes: int('RATE_LIMIT_MAX_EXECUTES', 20),
  },

  session: {
    ttlHours: int('SESSION_TTL_HOURS', 168),
    cookieName: str('SESSION_COOKIE_NAME', 'briokod_session'),
  },

  // Firebase Auth is the single source of identity; the API only verifies tokens.
  firebase: {
    projectId: str('FIREBASE_PROJECT_ID', 'briokod'),
    jwksUrl: str(
      'FIREBASE_JWKS_URL',
      'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
    ),
    jwksCacheMs: int('FIREBASE_JWKS_CACHE_MS', 86400000),
    timeoutMs: int('FIREBASE_TIMEOUT_MS', 5000),

    // Credenciais privileged (Admin SDK) usadas para escrever a pontuação das
    // salas. Sem elas o servidor continua a funcionar, mas o torneio não aceita
    // submissões. Aceita o JSON inline ou o caminho para a service account.
    adminCredentials: str('FIREBASE_ADMIN_CREDENTIALS', ''),
    adminEmail: str('FIREBASE_ADMIN_EMAIL', ''),
    adminPrivateKey: str('FIREBASE_ADMIN_PRIVATE_KEY', '').replace(/\\n/g, '\n'),
    adminProjectId: str('FIREBASE_ADMIN_PROJECT_ID', ''),
    adminDatabaseId: str('FIREBASE_ADMIN_DATABASE_ID', ''),
  },

  // UIDs promoted to platform admin (problems, moderation).
  adminUids: list('ADMIN_UIDS', []),

  adminKey: str('ADMIN_KEY', ''),
};

export { isLocalNetworkOrigin };

export function publicConfig() {
  return {
    env: config.env,
    executors: config.executors,
    limits: config.limits,
    poll: { intervalMs: config.pollIntervalMs, maxAttempts: config.pollMaxAttempts },
  };
}
