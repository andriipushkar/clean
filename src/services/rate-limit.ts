import { redis } from '@/lib/redis';

const LOGIN_PREFIX = 'rl:login:';
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 900; // 15 minutes in seconds

export class RateLimitError extends Error {
  constructor(
    message: string,
    public statusCode: number = 429,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Check and increment login attempts for IP+email combination.
 * Throws RateLimitError if blocked.
 */
export async function checkLoginRateLimit(ip: string, email: string): Promise<void> {
  const key = `${LOGIN_PREFIX}${ip}:${email.toLowerCase()}`;
  const current = await redis.get(key);

  if (current && Number(current) >= MAX_ATTEMPTS) {
    const ttl = await redis.ttl(key);
    throw new RateLimitError(
      `Забагато спроб входу. Спробуйте через ${Math.ceil(ttl / 60)} хвилин.`,
      429,
      ttl > 0 ? ttl : BLOCK_DURATION
    );
  }
}

/**
 * Record a failed login attempt.
 */
export async function recordFailedLogin(ip: string, email: string): Promise<void> {
  const key = `${LOGIN_PREFIX}${ip}:${email.toLowerCase()}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, BLOCK_DURATION);
  }
}

/**
 * Clear login attempts on successful login.
 */
export async function clearLoginAttempts(ip: string, email: string): Promise<void> {
  const key = `${LOGIN_PREFIX}${ip}:${email.toLowerCase()}`;
  await redis.del(key);
}
