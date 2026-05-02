/**
 * In-memory token bucket rate limiter.
 * Effective per-instance (Vercel Fluid Compute reuses instances).
 * Upgrade to Upstash Redis for distributed limiting if needed.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimiterConfig {
  maxTokens: number;
  refillRate: number; // tokens per second
  refillInterval: number; // ms between refills
}

const buckets = new Map<string, Bucket>();

// Clean stale buckets every 60s to prevent memory leaks
const CLEANUP_INTERVAL = 60_000;
const BUCKET_TTL = 120_000; // Remove buckets inactive for 2 minutes

let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > BUCKET_TTL) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  config: RateLimiterConfig
): { allowed: boolean; remaining: number; resetMs: number } {
  cleanup();

  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: config.maxTokens - 1, lastRefill: now };
    buckets.set(key, bucket);
    return { allowed: true, remaining: bucket.tokens, resetMs: config.refillInterval };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / config.refillInterval) * config.refillRate;

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    const resetMs = config.refillInterval - (elapsed % config.refillInterval);
    return { allowed: false, remaining: 0, resetMs };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens, resetMs: config.refillInterval };
}

// Preset configurations
export const RATE_LIMITS = {
  /** Global API: 60 requests per minute */
  global: { maxTokens: 60, refillRate: 1, refillInterval: 1000 } as RateLimiterConfig,
  /** Session creation: 5 per minute per IP */
  sessionCreate: { maxTokens: 5, refillRate: 1, refillInterval: 12000 } as RateLimiterConfig,
  /** LLM endpoints: 10 per minute per session */
  llm: { maxTokens: 10, refillRate: 1, refillInterval: 6000 } as RateLimiterConfig,
  /** Verification: 3 per minute per session (prevent enumeration) */
  verification: { maxTokens: 3, refillRate: 1, refillInterval: 20000 } as RateLimiterConfig,
} as const;
