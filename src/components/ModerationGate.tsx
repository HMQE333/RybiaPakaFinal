"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { emitAuthEvent } from "@/lib/authEvents";
import { writeAuthHint } from "@/lib/authState";
import { loadBootstrap } from "@/lib/clientBootstrap";

type ModerationNotice = {
  type?: string | null;
  reason?: string | null;
  by?: string | null;
  at?: string | null;
};

type ModerationInfo = {
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
  notice?: ModerationNotice | null;
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pl-PL");
}

export default function ModerationGate() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [data, setData] = useState<ModerationInfo | null>(null);
  const [noticeVisible, setNoticeVisible] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await loadBootstrap();
        if (!active) return;
        const moderation = (data.moderation ?? null) as ModerationInfo | null;
        if (!moderation) return;
        setData(moderation);
        if (moderation.notice) {
          setNoticeVisible(true);
        }
      } catch {
        // ignore
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const dismissNotice = async () => {
    setNoticeVisible(false);
    try {
      await fetch("/api/moderation-status", {
        method: "PATCH",
        credentials: "include",
      });
    } catch {
      // ignore
    }
  };

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

  const status = data?.status ?? "anon";
  const notice = data?.notice ?? null;
  const showNotice = Boolean(noticeVisible && notice && status === "ok");
  const allowlisted = useMemo(
    () => ["/odwolanie", "/kontakt"].some((prefix) => pathname.startsWith(prefix)),
    [pathname]
  );

  const noticeTitle = useMemo(() => {
    if (!notice?.type) return "Powiadomienie administracyjne";
    if (notice.type === "KICK") return "Wylogowano przez administratora";
    if (notice.type === "WARN") return "Ostrze\u017cenie od administratora";
    return "Powiadomienie administracyjne";
  }, [notice]);

  if (status === "anon" || status === "ok") {
    if (!showNotice) return null;
  }

  if (status === "banned" && !allowlisted) {
    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-background-2 p-6 text-center shadow-2xl">
          <h1 className="text-xl font-semibold">Konto zablokowane</h1>
          <p className="mt-2 text-sm text-foreground-2">
            Twoje konto zosta\u0142o zablokowane na sta\u0142e.
          </p>
          <div className="mt-4 space-y-1 text-sm text-foreground">
            <div>Pow\u00f3d: {data?.ban?.reason ?? "Naruszenie regulaminu."}</div>
            <div>Kara nadana przez: {data?.ban?.by ?? "Administrator"}</div>
            {data?.ban?.at && (
              <div>Data decyzji: {formatDate(data.ban.at)}</div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Link
              href="/odwolanie"
              className="rounded-xl bg-accent-2 px-4 py-2 text-sm text-black hover:bg-accent"
            >
              Je\u015bli chcesz si\u0119 odwo\u0142a\u0107, przejd\u017a do instrukcji
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/10 bg-background-3 px-4 py-2 text-sm text-foreground-2 hover:text-foreground"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "suspended" && !allowlisted) {
    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-background-2 p-6 text-center shadow-2xl">
          <h1 className="text-xl font-semibold">Przerwa na koncie</h1>
          <p className="mt-2 text-sm text-foreground-2">
            Twoje konto ma aktywn\u0105 przerw\u0119.
          </p>
          <div className="mt-4 space-y-1 text-sm text-foreground">
            {data?.suspension?.until && (
              <div>Do: {formatDate(data.suspension.until)}</div>
            )}
            <div>
              Kara nadana przez: {data?.suspension?.by ?? "Administrator"}
            </div>
            <div>
              Pow\u00f3d: {data?.suspension?.reason ?? "Naruszenie regulaminu."}
            </div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/10 bg-background-3 px-4 py-2 text-sm text-foreground-2 hover:text-foreground"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showNotice) {
    return (
      <div className="fixed left-1/2 bottom-6 z-[95] -translate-x-1/2 rounded-xl border border-white/10 bg-background-4/90 px-4 py-3 text-sm text-foreground shadow-2xl">
        <div className="font-medium">{noticeTitle}</div>
        {notice?.reason && (
          <div className="text-foreground-2">Pow\u00f3d: {notice.reason}</div>
        )}
        {notice?.by && (
          <div className="text-foreground-2">Przez: {notice.by}</div>
        )}
        <div className="mt-2">
          <button
            type="button"
            onClick={dismissNotice}
            className="rounded-lg border border-white/10 bg-background-3 px-3 py-1 text-xs text-foreground-2 hover:text-foreground"
          >
            Ok
          </button>
        </div>
      </div>
    );
  }

  return null;
}
