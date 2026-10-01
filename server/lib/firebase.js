import { createPublicKey, createVerify } from 'node:crypto';
import { config } from '../config.js';
import { AuthError } from './errors.js';
import { logger } from './logger.js';

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let cachedKeys = null;
let cachedAt = 0;

/**
 * Google rotates signing keys rarely; refetching once a day is plenty and keeps
 * the hot path free of network calls.
 */
async function signingKeys() {
  if (cachedKeys && Date.now() - cachedAt < config.firebase.jwksCacheMs) return cachedKeys;

  const response = await fetch(config.firebase.jwksUrl, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(config.firebase.timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Firebase JWKS respondeu ${response.status}`);
  }

  const jwks = await response.json();
  cachedKeys = new Map((jwks.keys ?? []).map((key) => [key.kid, key]));
  cachedAt = Date.now();

  if (cachedKeys.size === 0) throw new Error('Firebase JWKS veio sem chaves');
  return cachedKeys;
}

/** Drops the cache so a rotated key does not lock everyone out for a full day. */
export function invalidateFirebaseKeys() {
  cachedKeys = null;
  cachedAt = 0;
}

function decodeSegment(segment) {
  return Buffer.from(segment, 'base64url').toString('utf8');
}

function audienceMatches(audience) {
  const allowed = config.firebase.projectId;
  const value = Array.isArray(audience) ? audience : [audience];
  return value.includes(allowed);
}

/**
 * Verifies a Firebase ID token with the public keys from Google and returns its
 * claims. Throws AuthError when the token is expired, forged or aimed at
 * another project.
 */
export async function verifyIdToken(token) {
  if (!token || typeof token !== 'string') throw new AuthError('Token ausente');

  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthError('Token malformado');

  let header;
  let payload;
  try {
    header = JSON.parse(decodeSegment(parts[0]));
    payload = JSON.parse(decodeSegment(parts[1]));
  } catch {
    throw new AuthError('Token ilegível');
  }

  if (header.alg !== 'RS256') throw new AuthError(`Algoritmo não suportado: ${header.alg}`);

  const keys = await signingKeys();
  const jwk = keys.get(header.kid);
  if (!jwk) {
    invalidateFirebaseKeys();
    throw new AuthError('Chave de assinatura desconhecida');
  }

  const verified = createVerify('RSA-SHA256')
    .update(`${parts[0]}.${parts[1]}`)
    .verify(createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'));

  if (!verified) throw new AuthError('Assinatura inválida');

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) {
    throw new AuthError('Token expirado');
  }
  if (typeof payload.iat === 'number' && payload.iat > now + 60) {
    throw new AuthError('Token emitido no futuro');
  }
  if (!audienceMatches(payload.aud)) {
    throw new AuthError('Token emitido para outro projeto');
  }
  if (payload.iss !== `https://securetoken.google.com/${config.firebase.projectId}`) {
    throw new AuthError('Emissor não autorizado');
  }
  // No token ID do Firebase o uid é a claim `sub` — não existe uma claim
  // `uid`. `user_id` é o alias legado de tokens antigos, por isso o fallback.
  const uid = payload.sub ?? payload.user_id;
  if (!uid) throw new AuthError('Token sem uid');

  logger.debug('firebase token verified', { uid, provider: payload.firebase?.sign_in_provider });

  return {
    uid,
    email: payload.email ?? null,
    emailVerified: payload.email_verified === true,
    displayName: payload.name ?? null,
    photoURL: payload.picture ?? null,
    provider: payload.firebase?.sign_in_provider ?? 'unknown',
    isAdmin: payload.admin === true || config.adminUids.includes(uid),
  };
}

export { JWKS_URL };
