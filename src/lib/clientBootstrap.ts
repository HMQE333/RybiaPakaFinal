export type BootstrapUser = {
  username?: string | null;
  nick?: string | null;
  email?: string | null;
  role?: string | null;
};

export type BootstrapSession = {
  user?: BootstrapUser | null;
};

export type BootstrapSettings = {
  siteName?: string;
  maintenance?: boolean;
  headerBadge?: string;
};

export type BootstrapModerationNotice = {
  type?: string | null;
  reason?: string | null;
  by?: string | null;
  at?: string | null;
};

export type BootstrapModerationInfo = {
  status: "anon" | "ok" | "banned" | "suspended";
  ban?: {
    at?: string | null;
    reason?: string | null;
    by?: string | null;
  } | null;
  suspension?: {
    until?: string | null;
    at?: string | null;
    reason?: string | null;
    by?: string | null;
  } | null;
  notice?: BootstrapModerationNotice | null;
};

export type BootstrapPayload = {
  session: BootstrapSession | null;
  settings: BootstrapSettings | null;
  moderation: BootstrapModerationInfo | null;
};

const emptyPayload: BootstrapPayload = {
  session: null,
  settings: null,
  moderation: null,
};

let bootstrapPromise: Promise<BootstrapPayload> | null = null;
let bootstrapCache: BootstrapPayload | null = null;

export function loadBootstrap() {
  if (bootstrapCache) {
    return Promise.resolve(bootstrapCache);
  }

  if (!bootstrapPromise) {
    bootstrapPromise = fetch("/api/bootstrap", {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("BOOTSTRAP_FAILED");
        }
        const data = await res.json().catch(() => null);
        const payload: BootstrapPayload = {
          session: data?.session ?? null,
          settings: data?.settings ?? null,
          moderation: data?.moderation ?? null,
        };
        bootstrapCache = payload;
        return payload;
      })
      .catch(() => {
        bootstrapPromise = null;
        return emptyPayload;
      });
  }

  return bootstrapPromise;
}

export function clearBootstrapCache() {
  bootstrapPromise = null;
  bootstrapCache = null;
}
