type Entry = {
  count: number;
  firstAt: number;
  blockedAt: number | null;
};

const store = new Map<string, Entry>();

const CLEANUP_INTERVAL = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.firstAt > CLEANUP_INTERVAL) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

export type RateLimitRule = {
  maxAttempts: number;
  windowMs: number;
  blockMs: number;
};

export const AUTH_RULES = {
  signIn: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  } satisfies RateLimitRule,
  signUp: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
    blockMs: 60 * 60 * 1000,
  } satisfies RateLimitRule,
  social: {
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  } satisfies RateLimitRule,
};

export function checkRateLimit(
  ip: string,
  scope: string,
  rule: RateLimitRule
): { allowed: boolean; retryAfterMs: number } {
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, firstAt: now, blockedAt: null });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.blockedAt !== null) {
    const elapsed = now - entry.blockedAt;
    if (elapsed < rule.blockMs) {
      return { allowed: false, retryAfterMs: rule.blockMs - elapsed };
    }
    store.set(key, { count: 1, firstAt: now, blockedAt: null });
    return { allowed: true, retryAfterMs: 0 };
  }

  const windowElapsed = now - entry.firstAt;
  if (windowElapsed > rule.windowMs) {
    store.set(key, { count: 1, firstAt: now, blockedAt: null });
    return { allowed: true, retryAfterMs: 0 };
  }

  entry.count += 1;

  if (entry.count > rule.maxAttempts) {
    entry.blockedAt = now;
    return { allowed: false, retryAfterMs: rule.blockMs };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function getClientIp(req: { headers: { get(key: string): string | null } }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
