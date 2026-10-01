import { timingSafeEqual } from 'node:crypto';

/**
 * Firebase Auth is the only credential store, so nothing here hashes or
 * compares passwords. What remains is constant-time comparison for the admin
 * key, which arrives as a plain header.
 */
export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
