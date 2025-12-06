/**
 * Rate Limiting Service
 *
 * Uses Upstash Redis for distributed rate limiting.
 * Protects public endpoints from abuse.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client (lazy initialization)
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Rate limiting disabled: Missing Upstash credentials');
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

// Rate limiters for different endpoints
let publicFormLimiter: Ratelimit | null = null;
let emailSendLimiter: Ratelimit | null = null;

/**
 * Rate limiter for public form submissions
 * Allows 5 submissions per hour per IP
 */
export function getPublicFormLimiter(): Ratelimit | null {
  if (publicFormLimiter) return publicFormLimiter;

  const redisClient = getRedis();
  if (!redisClient) return null;

  publicFormLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'ratelimit:public-form',
  });

  return publicFormLimiter;
}

/**
 * Rate limiter for email sending
 * Allows 10 emails per hour per user
 */
export function getEmailSendLimiter(): Ratelimit | null {
  if (emailSendLimiter) return emailSendLimiter;

  const redisClient = getRedis();
  if (!redisClient) return null;

  emailSendLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'ratelimit:email-send',
  });

  return emailSendLimiter;
}

/**
 * Check rate limit for a given identifier
 * Returns { success: true } if not rate limited
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  if (!limiter) {
    // Rate limiting disabled, allow all requests
    return { success: true };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the request (fail open)
    return { success: true };
  }
}
