"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { loadBootstrap } from "@/lib/clientBootstrap";

type SiteSettings = {
  siteName?: string;
  maintenance?: boolean;
};

type SessionUser = {
  role?: string | null;
};

const ALLOWLIST_PREFIXES = [
  "/administracja",
  "/admin",
  "/logowanie",
  "/rejestracja",
  "/odzyskaj-haslo",
  "/reset-hasla",
  "/errorauth",
];

export default function MaintenanceGate() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const pathname = usePathname() || "/";

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await loadBootstrap();
        if (!active) return;
        setSettings((data.settings ?? null) as SiteSettings | null);
        setUser((data.session?.user ?? null) as SessionUser | null);
      } catch {
        if (!active) return;
        setSettings(null);
        setUser(null);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const maintenance = Boolean(settings?.maintenance);
  const isAdmin = user?.role === "ADMIN" || user?.role === "OWNER";
  const allowed = useMemo(
    () => ALLOWLIST_PREFIXES.some((prefix) => pathname.startsWith(prefix)),
    [pathname]
  );

  const shouldBlock = maintenance && !isAdmin && !allowed;
  if (!shouldBlock) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-background-2 p-6 text-center shadow-2xl">
        <h1 className="text-xl font-semibold">Tryb konserwacji</h1>
        <p className="mt-2 text-sm text-foreground-2">
          {settings?.siteName ?? "RybiaPaka.pl"} jest chwilowo niedostępna.
          Spróbuj ponownie za jakiś czas.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={`/logowanie?next=${encodeURIComponent(pathname)}`}
            className="rounded-xl bg-accent-2 px-4 py-2 text-sm text-black hover:bg-accent"
          >
            Jestem administratorem — zaloguj się
          </Link>
          <Link
            href="/kontakt"
            className="rounded-xl border border-white/10 bg-background-3 px-4 py-2 text-sm text-foreground-2 hover:text-foreground"
          >
            Kontakt
          </Link>
        </div>
      </div>
    </div>
  );
}
