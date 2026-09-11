/**
 * Rate Limiter & Account Lockout Guard
 * Handles lockout after 5 consecutive failed login attempts (15 min cooldown)
 * and generic rate limiting per IP / User for sensitive routes.
 */

interface LockoutRecord {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const lockoutStore = new Map<string, LockoutRecord>();
const rateLimitStore = new Map<string, RateLimitRecord>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Checks if an identifier (email or IP) is currently locked out due to failed attempts.
 */
export function getLockoutStatus(identifier: string): { isLocked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const normalizedKey = identifier.trim().toLowerCase();
  const record = lockoutStore.get(normalizedKey);
  const now = Date.now();

  if (!record) {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  }

  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds, attemptsLeft: 0 };
  }

  // If lockout expired, reset lockout state
  if (record.lockedUntil && now >= record.lockedUntil) {
    lockoutStore.delete(normalizedKey);
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  }

  const attemptsLeft = Math.max(0, MAX_LOGIN_ATTEMPTS - record.attempts);
  return { isLocked: false, remainingSeconds: 0, attemptsLeft };
}

/**
 * Records a failed login attempt. Returns updated lockout status.
 */
export function recordFailedLogin(identifier: string): { isLocked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const normalizedKey = identifier.trim().toLowerCase();
  const now = Date.now();
  const record = lockoutStore.get(normalizedKey) || { attempts: 0, lockedUntil: null, lastAttempt: now };

  // Reset counter if last attempt was over 30 minutes ago
  if (now - record.lastAttempt > 30 * 60 * 1000 && !record.lockedUntil) {
    record.attempts = 0;
  }

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    lockoutStore.set(normalizedKey, record);
    const remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    return { isLocked: true, remainingSeconds, attemptsLeft: 0 };
  }

  lockoutStore.set(normalizedKey, record);
  const attemptsLeft = MAX_LOGIN_ATTEMPTS - record.attempts;
  return { isLocked: false, remainingSeconds: 0, attemptsLeft };
}

/**
 * Clears failed login attempts after a successful login.
 */
export function clearFailedLogins(identifier: string): void {
  const normalizedKey = identifier.trim().toLowerCase();
  lockoutStore.delete(normalizedKey);
}

/**
 * Generic Rate Limiter (Sliding Window Algorithm)
 * @param key Identifier (e.g. `ip:127.0.0.1` or `user:usr_123:route_ai`)
 * @param maxRequests Maximum number of requests allowed in window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(key: string, maxRequests: number = 30, windowMs: number = 60000): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetInMs: windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetInMs: Math.max(0, record.resetAt - now) };
  }

  record.count += 1;
  rateLimitStore.set(key, record);
  return { allowed: true, remaining: maxRequests - record.count, resetInMs: Math.max(0, record.resetAt - now) };
}
