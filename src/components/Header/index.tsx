"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LucideBell,
  LucideLogOut,
  LucideShield,
  LucideUser,
  LucideUserPlus,
} from "lucide-react";

import Logo from "../Logo";
import Navigation from "../Navigation";
import ActionButton from "./ActionButton";
import { emitAuthEvent } from "@/lib/authEvents";
import { readAuthHint, writeAuthHint } from "@/lib/authState";
import { loadBootstrap } from "@/lib/clientBootstrap";

type SessionUser = {
  username?: string | null;
  nick?: string | null;
  email?: string | null;
  role?: string | null;
};

type NotificationItem = {
  id: string;
  type: string;
  payload: string | null;
  createdAt: string;
  readAt: string | null;
};

type ParsedNotification = {
  title: string;
  description?: string;
  href?: string;
};

const HEADER_BADGE_STORAGE_KEY = "rybiapaka:header-badge";
const ROLE_HINT_STORAGE_KEY = "rybiapaka:role-hint";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authHint, setAuthHint] = useState<boolean | null>(null);
  const [roleHint, setRoleHint] = useState<string | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [headerBadge, setHeaderBadge] = useState("");
  const [notifications, setNotifications] = useState<{
    count: number;
    items: NotificationItem[];
  }>({ count: 0, items: [] });
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    const hint = readAuthHint();
    if (hint !== null) {
      setAuthHint(hint);
    }
    if (typeof window === "undefined") return;
    try {
      const cachedBadge = window.localStorage.getItem(HEADER_BADGE_STORAGE_KEY);
      if (cachedBadge) {
        setHeaderBadge(cachedBadge);
      }
      const cachedRole = window.localStorage.getItem(ROLE_HINT_STORAGE_KEY);
      if (cachedRole) {
        setRoleHint(cachedRole);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadBootstrapData = async () => {
      try {
        const data = await loadBootstrap();
        if (!active) return;
        const nextUser = (data.session?.user ?? null) as SessionUser | null;
        setUser(nextUser);
        const authed = Boolean(nextUser);
        setAuthHint(authed);
        writeAuthHint(authed);
        const nextRole =
          typeof nextUser?.role === "string" ? nextUser.role : null;
        setRoleHint(nextRole);
        try {
          if (nextRole) {
            window.localStorage.setItem(ROLE_HINT_STORAGE_KEY, nextRole);
          } else {
            window.localStorage.removeItem(ROLE_HINT_STORAGE_KEY);
          }
        } catch {
          // ignore storage errors
        }
        if (nextUser) {
          emitAuthEvent("login");
        }

        const nextBadge =
          typeof data.settings?.headerBadge === "string"
            ? data.settings.headerBadge
            : "";
        setHeaderBadge(nextBadge);
        try {
          if (nextBadge) {
            window.localStorage.setItem(HEADER_BADGE_STORAGE_KEY, nextBadge);
          } else {
            window.localStorage.removeItem(HEADER_BADGE_STORAGE_KEY);
          }
        } catch {
          // ignore storage errors
        }
      } catch {
        if (!active) return;
        setUser(null);
        setAuthHint(false);
        writeAuthHint(false);
        setRoleHint(null);
        try {
          window.localStorage.removeItem(ROLE_HINT_STORAGE_KEY);
        } catch {
          // ignore storage errors
        }
        setHeaderBadge("");
        try {
          window.localStorage.removeItem(HEADER_BADGE_STORAGE_KEY);
        } catch {
          // ignore storage errors
        }
      } finally {
        if (active) {
          setSessionResolved(true);
        }
      }
    };

    loadBootstrapData();

    return () => {
      active = false;
    };
  }, []);

  const username =
    user?.username ||
    user?.nick ||
    (user?.email ? user.email.split("@")[0] : undefined);
  const badgeLabel = headerBadge.trim();
  const accountHref = "/profil";
  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "OWNER";
  const isAdminHint = roleHint === "ADMIN" || roleHint === "OWNER";
  const showAdmin = sessionResolved ? isAdmin : isAdminHint;
  const showSkeleton = !sessionResolved && authHint === null;
  const showLoggedIn = sessionResolved ? isLoggedIn : authHint === true;
  const showLoggedOut = sessionResolved ? !isLoggedIn : authHint === false;

  const parseNotification = (item: NotificationItem): ParsedNotification => {
    const fallbackTitle = item.type || "Powiadomienie";
    if (!item.payload) {
      return { title: fallbackTitle };
    }
    try {
      const parsed = JSON.parse(item.payload);
      if (parsed && typeof parsed === "object") {
        const title =
          typeof parsed.title === "string" && parsed.title.trim()
            ? parsed.title
            : fallbackTitle;
        const description =
          typeof parsed.message === "string"
            ? parsed.message
            : typeof parsed.body === "string"
              ? parsed.body
              : undefined;
        const href =
          typeof parsed.href === "string"
            ? parsed.href
            : typeof parsed.url === "string"
              ? parsed.url
              : undefined;
        return { title, description, href };
      }
    } catch {
      // fallback to raw payload
    }
    return { title: fallbackTitle, description: item.payload };
  };

  const loadNotifications = async () => {
    if (notifLoading) return;
    setNotifLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      setNotifications({
        count: Number(data?.count ?? 0),
        items: Array.isArray(data?.items) ? data.items : [],
      });
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionResolved) {
      return;
    }
    if (isLoggedIn) {
      loadNotifications();
    } else {
      setNotifications({ count: 0, items: [] });
      setNotifOpen(false);
    }
  }, [isLoggedIn, sessionResolved]);

  useEffect(() => {
    if (!sessionResolved || !notifOpen || !isLoggedIn) return;
    loadNotifications();
  }, [notifOpen, isLoggedIn, sessionResolved]);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // ignore
    } finally {
      setLoggingOut(false);
      setUser(null);
      setNotifOpen(false);
      writeAuthHint(false);
      setAuthHint(false);
      setRoleHint(null);
      try {
        window.localStorage.removeItem(ROLE_HINT_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
      emitAuthEvent("logout");
      if (typeof window !== "undefined") {
        window.location.replace("/");
        return;
      }
      router.refresh();
      router.push("/");
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-sm">
      <div className="min-h-[70px] bg-background/95 border-b border-background-3 flex items-start justify-between gap-3 py-2 lg:h-[70px] lg:items-center lg:py-0">
        <div className="flex min-w-0 items-center gap-3 pl-4 lg:gap-[15px] lg:pl-[30px]">
          <Logo size={50} />

          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center gap-2">
              {badgeLabel && (
                <span className="max-w-[110px] truncate rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-accent sm:max-w-none sm:px-2 sm:text-[9px] sm:tracking-[0.28em]">
                  {badgeLabel}
                </span>
              )}
              <p className="text-[clamp(13px,3.6vw,14px)] text-accent tracking-wide sm:text-[14px]">
                RybiaPaka.pl
              </p>
            </div>
            <p className="text-[clamp(10px,2.8vw,12px)] text-foreground-2 leading-snug max-w-[220px] sm:max-w-none whitespace-normal">
              Zintegrowana Platforma Wędkarska
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pr-4 lg:gap-3 lg:pr-[30px]">
          {showSkeleton ? (
            <div className="flex items-center gap-3">
              <div className="h-9 w-24 rounded-lg bg-background-4/80 animate-pulse" />
              <div className="h-9 w-24 rounded-lg bg-background-4/80 animate-pulse" />
            </div>
          ) : showLoggedIn ? (
            <>
              {showAdmin && (
                <Link
                  href="/administracja"
                  aria-label="Administracja"
                  className="flex items-center justify-center gap-2 px-2 py-2 text-foreground-2 hover:text-accent border border-background-4 rounded-lg transition-colors sm:px-3 lg:gap-[15px] lg:px-4"
                  title="Panel Administracyjny"
                >
                  <LucideShield size={16} />
                  <p className="text-[12px] max-sm:hidden">Administracja</p>
                </Link>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  className="relative flex items-center justify-center gap-2 px-2 py-2 text-foreground-2 hover:text-accent border border-background-4 rounded-lg transition-colors sm:px-3 lg:gap-[15px] lg:px-4"
                  title="Powiadomienia"
                  aria-label="Powiadomienia"
                >
                  <LucideBell size={16} />
                  {notifications.count > 0 && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-black">
                      {notifications.count > 99 ? "99+" : notifications.count}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-background-2 p-3 shadow-2xl">
                    <div className="text-xs font-semibold uppercase tracking-wide text-foreground-2">
                      Powiadomienia
                    </div>
                    <div className="mt-2 space-y-2 text-sm">
                      {notifLoading ? (
                        <div className="rounded-xl border border-white/10 bg-background-3 p-3 text-foreground-2">
                          Ładowanie...
                        </div>
                      ) : notifications.items.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-background-3 p-3 text-foreground-2">
                          Brak nowych powiadomień.
                        </div>
                      ) : (
                        notifications.items.map((item) => {
                          const parsed = parseNotification(item);
                          const content = (
                            <>
                              <div className="font-medium text-foreground">
                                {parsed.title}
                              </div>
                              {parsed.description && (
                                <div className="text-xs text-foreground-2">
                                  {parsed.description}
                                </div>
                              )}
                            </>
                          );

                          if (parsed.href) {
                            return (
                              <Link
                                key={item.id}
                                href={parsed.href}
                                onClick={() => setNotifOpen(false)}
                                className="block rounded-xl border border-white/10 bg-background-3 p-3 text-left hover:border-accent/40"
                              >
                                {content}
                              </Link>
                            );
                          }

                          return (
                            <div
                              key={item.id}
                              className="rounded-xl border border-white/10 bg-background-3 p-3 text-left"
                            >
                              {content}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Link
                href={accountHref}
                aria-label="Konto"
                className="flex items-center justify-center gap-2 px-2 py-2 text-foreground-2 hover:text-accent border border-background-4 rounded-lg transition-colors sm:px-3 lg:gap-[15px] lg:px-4"
              >
                <LucideUser size={16} />
                <p className="text-[12px] max-sm:hidden">Konto</p>
              </Link>
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                aria-label="Wyloguj"
                className="flex items-center justify-center gap-2 px-2 py-2 text-foreground-2 hover:text-accent border border-background-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed sm:px-3 lg:gap-[15px] lg:px-4"
              >
                <LucideLogOut size={16} />
                <p className="text-[12px] max-sm:hidden">
                  {loggingOut ? "Wylogowywanie..." : "Wyloguj się"}
                </p>
              </button>
            </>
          ) : showLoggedOut ? (
            <>
              <ActionButton
                title="Zarejestruj się"
                icon={<LucideUserPlus size={16} />}
                url="/rejestracja"
              />

              <ActionButton
                title="Zaloguj się"
                icon={<LucideUser size={16} />}
                url="/logowanie"
              />
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-9 w-24 rounded-lg bg-background-4/80 animate-pulse" />
              <div className="h-9 w-24 rounded-lg bg-background-4/80 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </header>
  );
}

