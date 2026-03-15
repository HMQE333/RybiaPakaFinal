"use client";

import { useMemo, useState } from "react";
import { LucideDownload, LucideSearch } from "lucide-react";

type AdminLogRow = {
  id: string;
  time: string;
  message: string;
  level: string;
  actor: string;
};

export default function LogsList({ logs }: { logs: AdminLogRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return logs;
    const q = query.toLowerCase();
    return logs.filter(
      (l) =>
        l.message.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        l.level.toLowerCase().includes(q) ||
        l.time.toLowerCase().includes(q)
    );
  }, [logs, query]);

  const levelBadge = (level: string) => {
    const normalized = (level || "").toUpperCase();
    if (normalized === "ERROR") return "border-red-500/30 bg-red-600/10 text-red-200";
    if (normalized === "WARN") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    return "border-white/10 bg-background-2 text-foreground-2";
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-background-3 rounded-xl border border-white/10 w-full">
          <LucideSearch size={16} className="text-foreground-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj w logach..."
            className="w-full bg-transparent outline-none text-[13px] text-foreground placeholder:text-foreground-2"
          />
        </div>

        <a
          href="/api/admin/logs/export?format=csv"
          className="px-3 py-2 bg-background-3 rounded-xl border border-white/10 flex items-center gap-2 text-sm text-foreground-2 hover:text-foreground"
        >
          <LucideDownload size={16} /> Eksport
        </a>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((l) => (
          <div
            key={l.id}
            className="p-3 bg-background-3 rounded-xl border border-white/10 text-[13px] text-foreground-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-foreground">
                {new Date(l.time).toLocaleString("pl-PL")}
              </div>
              {l.actor && (
                <span className="rounded-full border border-white/10 bg-background-2 px-2 py-0.5 text-[11px] text-foreground-2">
                  {l.actor}
                </span>
              )}
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] ${levelBadge(
                  l.level
                )}`}
              >
                {l.level}
              </span>
            </div>
            <div>{l.message}</div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-3 text-foreground-2">Brak wpisów.</div>
        )}
      </div>
    </div>
  );
}
