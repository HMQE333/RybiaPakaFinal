import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RateLimitRule = {
  key: string;
  pathPrefix: string;
  limit: number;
  windowMs: number;
  methods: string[];
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    key: "auth",
    pathPrefix: "/api/auth/",
    limit: 10,
    windowMs: 10 * 60 * 1000,
    methods: ["POST"],
  },
  {
    key: "api-write",
    pathPrefix: "/api/",
    limit: 120,
    windowMs: 60 * 1000,
    methods: ["POST", "PUT", "PATCH", "DELETE"],
  },
];
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const CANONICAL_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rybiapaka.pl";
const CANONICAL_URL = new URL(CANONICAL_ORIGIN);
const CANONICAL_HOST = CANONICAL_URL.hostname.toLowerCase();
const CANONICAL_PROTOCOL = CANONICAL_URL.protocol.replace(":", "").toLowerCase();
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const CANONICAL_HOST_ALIASES = new Set([CANONICAL_HOST]);

if (CANONICAL_HOST.startsWith("www.")) {
  CANONICAL_HOST_ALIASES.add(CANONICAL_HOST.replace(/^www\./, ""));
} else {
  CANONICAL_HOST_ALIASES.add(`www.${CANONICAL_HOST}`);
}

const USERS_PATH = "/administracja/u\u017cytkownicy";
const USERS_ASCII_PATH = "/administracja/uzytkownicy";
const REPORTS_PATH = "/administracja/zg\u0142oszenia";
const REPORTS_ASCII_PATH = "/administracja/zgloszenia";

const ADMIN_CANONICAL_ROUTES: Record<string, string> = {
  "/admin": "/administracja",
  "/panel": "/administracja",
  "/admin/users": USERS_ASCII_PATH,
  "/admin/reports": REPORTS_ASCII_PATH,
  "/admin/content": "/administracja/moderacja",
  "/admin/archive": "/administracja/archiwum",
  "/admin/settings": "/administracja/ustawienia",
  "/admin/logs": "/administracja/logi",
};

function safeDecode(pathname: string) {
  try {
    return decodeURI(pathname);
  } catch {
    return pathname;
  }
}

function replacePrefix(pathname: string, from: string, to: string) {
  if (pathname === from) return to;
  if (pathname.startsWith(`${from}/`)) {
    return `${to}${pathname.slice(from.length)}`;
  }
  return null;
}

function isLocalhostHost(hostname: string) {
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith(".local");
}

function getClientId(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
  const ip =
    forwardedFor.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";
  if (ip) return ip;
  const ua = req.headers.get("user-agent") ?? "unknown";
  return `ua:${ua}`;
}

function isAllowedOrigin(req: NextRequest) {
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  if (!host) return true;

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  const fetchSite = req.headers.get("sec-fetch-site");
  if (
    fetchSite &&
    fetchSite !== "same-origin" &&
    fetchSite !== "same-site" &&
    fetchSite !== "none"
  ) {
    return false;
  }

  return true;
}

function checkRateLimit(rule: RateLimitRule, clientId: string, now: number) {
  const key = `${rule.key}:${clientId}`;
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs });
    return null;
  }

  entry.count += 1;
  if (entry.count > rule.limit) {
    return Math.ceil((entry.resetAt - now) / 1000);
  }

  return null;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rawPathname = new URL(req.url).pathname || "/";
  let pathname = safeDecode(rawPathname);

  try {
    pathname = pathname.normalize("NFC");
  } catch {
    // ignore invalid normalization
  }

  const forwardedHost = req.headers.get("x-forwarded-host") ?? "";
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "";
  const hostHeader = req.headers.get("host") ?? "";
  const forwardedHostname =
    forwardedHost.split(",")[0]?.split(":")[0]?.trim().toLowerCase() ?? "";
  const hostHostname =
    hostHeader.split(",")[0]?.split(":")[0]?.trim().toLowerCase() ?? "";
  const hostname = hostHostname || forwardedHostname;
  const proto =
    (forwardedProto || req.nextUrl.protocol.replace(":", ""))
      .split(",")[0]
      ?.trim()
      .toLowerCase() ?? "";
  const canEnforceProtocol = Boolean(forwardedProto);
  const canEnforceHost = Boolean(hostHostname || forwardedHostname);

  if (hostname && !isLocalhostHost(hostname) && canEnforceHost) {
    const hostMatchesCanonical =
      CANONICAL_HOST_ALIASES.has(hostHostname) ||
      CANONICAL_HOST_ALIASES.has(forwardedHostname);
    const hostMismatch = !hostMatchesCanonical;
    const protoMismatch =
      canEnforceProtocol && proto && proto !== CANONICAL_PROTOCOL;
    if (hostMismatch || protoMismatch) {
      url.hostname = CANONICAL_HOST;
      if (protoMismatch) {
        url.protocol = `${CANONICAL_PROTOCOL}:`;
      }
      url.port = "";
      return NextResponse.redirect(url, 301);
    }
  }

  if (pathname.startsWith("/api/")) {
    const method = req.method.toUpperCase();
    if (!SAFE_METHODS.has(method) && !isAllowedOrigin(req)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const now = Date.now();
    const clientId = getClientId(req);
    const isAuthPath = pathname.startsWith("/api/auth/");
    for (const rule of RATE_LIMIT_RULES) {
      if (
        (!isAuthPath || rule.key === "auth") &&
        pathname.startsWith(rule.pathPrefix) &&
        rule.methods.includes(method)
      ) {
        const retryAfter = checkRateLimit(rule, clientId, now);
        if (retryAfter !== null) {
          return NextResponse.json(
            { error: "RATE_LIMITED" },
            { status: 429, headers: { "Retry-After": String(retryAfter) } }
          );
        }
      }
    }

    if (rateLimitStore.size > 5000) {
      for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt <= now) {
          rateLimitStore.delete(key);
        }
      }
    }
  }

  const panelRedirect = replacePrefix(pathname, "/panel", "/administracja");
  if (panelRedirect) {
    url.pathname = panelRedirect;
    return NextResponse.redirect(url);
  }

  const adminUsersRedirect = replacePrefix(
    pathname,
    "/admin/users",
    USERS_ASCII_PATH
  );
  if (adminUsersRedirect) {
    url.pathname = adminUsersRedirect;
    return NextResponse.redirect(url);
  }

  const adminReportsRedirect = replacePrefix(
    pathname,
    "/admin/reports",
    REPORTS_ASCII_PATH
  );
  if (adminReportsRedirect) {
    url.pathname = adminReportsRedirect;
    return NextResponse.redirect(url);
  }

  const adminCanonical = ADMIN_CANONICAL_ROUTES[pathname];
  if (adminCanonical) {
    url.pathname = adminCanonical;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin/")) {
    url.pathname = pathname.replace("/admin", "/administracja");
    return NextResponse.redirect(url);
  }

  const usersRedirect = replacePrefix(pathname, USERS_PATH, USERS_ASCII_PATH);
  if (usersRedirect) {
    url.pathname = usersRedirect;
    return NextResponse.redirect(url);
  }

  const reportsRedirect = replacePrefix(pathname, REPORTS_PATH, REPORTS_ASCII_PATH);
  if (reportsRedirect) {
    url.pathname = reportsRedirect;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-canonical-path", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/:path*"],
};


