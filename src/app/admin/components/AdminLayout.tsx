"use client";

import {
  LucideAlertCircle,
  LucideArrowLeft,
  LucideArchive,
  LucideBell,
  LucideFlag,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideNewspaper,
  LucideSparkles,
  LucideSettings,
  LucideShield,
  LucideUsers,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Logo from "@/components/Logo";
import { emitAuthEvent } from "@/lib/authEvents";
import { writeAuthHint } from "@/lib/authState";
import { cn } from "@/utils";
import { AdminViewerProvider } from "./AdminContext";

type Viewer = {
  id: number;
  email: string;
  username: string | null;
  nick: string | null;
  role: string;
};

type NavItem = {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
};

type AdminNotificationItem = {
  id: string;
  title: string;
  category: string;
  createdAt: string;
};

function AdminNavItem({
  href,
  icon: Icon,
  title,
  active,
}: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors",
        active
          ? "border-white/10 bg-background-3 text-foreground"
          : "border-transparent bg-transparent text-foreground-2 hover:border-white/10 hover:bg-background-3/60 hover:text-foreground"
      )}
    >
      <Icon size={18} className={active ? "text-accent" : "text-accent/80"} />
      <span className="text-sm font-medium">{title}</span>
    </Link>
  );
}

export default function AdminLayout({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer: Viewer;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<{
    count: number;
    items: AdminNotificationItem[];
  }>({ count: 0, items: [] });
  const [notifOpen, setNotifOpen] = useState(false);

  const adminBase = "/administracja";
  const navItems = useMemo<NavItem[]>(
    () => [
      { href: adminBase, icon: LucideLayoutDashboard, title: "Pulpit" },
      { href: `${adminBase}/dla-ciebie`, icon: LucideSparkles, title: "Statystyki" },
      { href: `${adminBase}/informacje`, icon: LucideNewspaper, title: "Informacje" },
      { href: `${adminBase}/uzytkownicy`, icon: LucideUsers, title: "Użytkownicy" },
      { href: `${adminBase}/zgloszenia`, icon: LucideFlag, title: "Zgłoszenia" },
      { href: `${adminBase}/moderacja`, icon: LucideShield, title: "Moderacja" },
      { href: `${adminBase}/archiwum`, icon: LucideArchive, title: "Archiwum 24h" },
      { href: `${adminBase}/ustawienia`, icon: LucideSettings, title: "Ustawienia" },
      { href: `${adminBase}/logi`, icon: LucideAlertCircle, title: "Logi" },
    ],
    [adminBase]
  );

  const viewerLabel =
    viewer.username || viewer.nick || viewer.email.split("@")[0] || "Administrator";
  const isAdminViewer = viewer.role === "ADMIN" || viewer.role === "OWNER";

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const res = await fetch("/api/admin/notifications", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setNotifications({
          count: Number(data?.count ?? 0),
          items: Array.isArray(data?.items) ? data.items : [],
        });
      } catch {
        // ignore
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // ignore
    } finally {
      writeAuthHint(false);
      emitAuthEvent("logout");
      router.push("/");
      router.refresh();
    }
  };

  const normalizedPathname = useMemo(() => {
    if (!pathname) return "";
    try {
      return decodeURI(pathname);
    } catch {
      return pathname;
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (!normalizedPathname) return false;
    if (href === adminBase) return normalizedPathname === adminBase;
    return (
      normalizedPathname === href || normalizedPathname.startsWith(`${href}/`)
    );
  };

  return (
    <AdminViewerProvider viewer={viewer}>
      <div className="min-h-svh w-full bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground-2 hover:text-foreground md:hidden"
              aria-label="Otwórz menu admina"
            >
              Menu
            </button>

            <Link href="/" className="flex items-center gap-3">
              <Logo size={40} />
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-wide text-accent">
                  Panel Administracyjny
                </div>
                <div className="text-xs text-foreground-2">RybiaPaka.pl</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span
                className={cn(
                  "text-sm font-medium",
                  isAdminViewer ? "text-accent" : "text-foreground"
                )}
              >
                {viewerLabel}
              </span>
              <span className="text-xs text-foreground-2">{viewer.role}</span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative inline-flex items-center justify-center rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground-2 hover:text-foreground"
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
                    {notifications.items.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-background-3 p-3 text-foreground-2">
                        Brak nowych powiadomień.</div>
                    ) : (
                      notifications.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            router.push(`${adminBase}/zgloszenia/${item.id}`);
                          }}
                          className="w-full rounded-xl border border-white/10 bg-background-3 p-3 text-left hover:border-accent/40"
                        >
                          <div className="font-medium text-foreground">
                            {item.title}
                          </div>
                          <div className="text-xs text-foreground-2">
                            {item.category}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground-2 hover:text-foreground"
              title="Wróć do strony"
            >
              <LucideArrowLeft size={16} />
              <span className="hidden sm:inline">Strona</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground-2 hover:text-foreground"
              title="Wyloguj"
            >
              <LucideLogOut size={16} />
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[260px_1fr] md:px-6">
        <aside className="hidden md:block">
          <div className="sticky top-[74px] rounded-2xl border border-white/10 bg-background-2 p-3">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <AdminNavItem
                  key={item.href}
                  {...item}
                  active={isActive(item.href)}
                />
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-black/60"
            aria-label="Zamknij menu"
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm border-r border-white/10 bg-background p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo size={38} />
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-foreground">
                    Administracja
                  </div>
                  <div
                    className={cn(
                      "text-xs",
                      isAdminViewer ? "text-accent" : "text-foreground-2"
                    )}
                  >
                    {viewerLabel}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground-2"
              >
                Zamknij
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setNavOpen(false);
                    router.push(item.href);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm font-medium",
                    isActive(item.href)
                      ? "border-white/10 bg-background-3 text-foreground"
                      : "border-transparent bg-transparent text-foreground-2 hover:border-white/10 hover:bg-background-3/60 hover:text-foreground"
                  )}
                >
                  <item.icon size={18} className="text-accent/80" />
                  {item.title}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
      </div>
    </AdminViewerProvider>
  );
}





