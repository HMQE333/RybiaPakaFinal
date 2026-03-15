"use client";

import { useMemo, useState } from "react";
import type { ReportStatus } from "@/lib/prismaEnums";
import { useRouter } from "next/navigation";
import {
  LucideCheckCircle,
  LucideInbox,
  LucideSearch,
  LucideTrash2,
  LucideXCircle,
} from "lucide-react";

type AdminReportRow = {
  id: string;
  title: string;
  type: string;
  status: ReportStatus;
  author: string;
  targetType?: string | null;
  targetId?: string | null;
};

const deletableTargets = new Set([
  "thread",
  "post",
  "gallery-item",
  "gallery-comment",
]);

const canDeleteTarget = (row: AdminReportRow) => {
  if (row.type !== "CONTENT") return false;
  if (!row.targetId) return false;
  const targetType = (row.targetType ?? "").toLowerCase();
  return deletableTargets.has(targetType);
};

function statusLabel(status: ReportStatus) {
  switch (status) {
    case "PENDING":
      return "Nowe";
    case "IN_REVIEW":
      return "W toku";
    case "RESOLVED":
      return "Zamknięte";
    case "REJECTED":
      return "Odrzucone";
    default:
      return status;
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "BUG":
      return "Błąd";
    case "USER":
      return "Użytkownik";
    case "SUGGESTION":
      return "Sugestia";
    case "CONTENT":
      return "Treść";
    case "SPAM":
      return "Spam";
    case "OTHER":
      return "Inne";
    default:
      return type;
  }
}

export default function ReportsList({ reports }: { reports: AdminReportRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminReportRow[]>(reports);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
    );
  }, [query, rows]);

  const setBusy = (id: string, value: boolean) =>
    setBusyIds((prev) => ({ ...prev, [id]: value }));

  const toast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2400);
  };

  const updateStatus = async (reportId: string, status: ReportStatus) => {
    setBusy(reportId, true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.report) {
        toast("Nie udało się zmienić statusu.");
        return;
      }

      if (status === "REJECTED" || status === "RESOLVED") {
        setRows((prev) => prev.filter((r) => r.id !== reportId));
      } else {
        setRows((prev) =>
          prev.map((r) =>
            r.id === reportId ? { ...r, status: data.report.status } : r
          )
        );
      }
      toast("Zapisano zmianę statusu.");
      router.refresh();
    } finally {
      setBusy(reportId, false);
    }
  };

  const deleteTarget = async (reportId: string) => {
    setBusy(reportId, true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        toast("Nie udało się usunąć treści.");
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== reportId));
      toast("Treść usunięta.");
      router.refresh();
    } finally {
      setBusy(reportId, false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-background-3 px-3 py-2">
          <LucideSearch size={16} className="text-foreground-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj zgłoszenia..."
            className="w-full bg-transparent text-[13px] text-foreground placeholder:text-foreground-2 outline-none"
          />
        </div>
        <div className="hidden items-center gap-2 text-sm text-foreground-2 md:flex">
          <LucideInbox size={16} />
          <span>{filtered.length} pozycji</span>
        </div>
      </div>

      {filtered.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-background-3 p-4"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{r.title}</p>
            <p className="mt-1 text-sm text-foreground-2">
              Typ: {typeLabel(r.type)} • Status: {statusLabel(r.status)} • Autor:{" "}
              {r.author || "Anonim"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              className="rounded-xl bg-accent-2 px-3 py-2 text-black hover:bg-accent disabled:opacity-60"
              onClick={() => router.push(`/administracja/zgloszenia/${r.id}`)}
              disabled={busyIds[r.id]}
            >Otwórz</button>
            {canDeleteTarget(r) ? (
              <button
                className="rounded-xl border border-white/10 bg-background-2 p-2 hover:border-red-500/30 hover:bg-red-600/10 disabled:opacity-60"
                onClick={() => deleteTarget(r.id)}
                disabled={busyIds[r.id]}
                title="Usuń treść"
              >
                <LucideTrash2 />
              </button>
            ) : (
              <button
                className="rounded-xl border border-white/10 bg-background-2 p-2 hover:border-accent/30 hover:bg-accent/10 disabled:opacity-60"
                onClick={() => updateStatus(r.id, "RESOLVED")}
                disabled={busyIds[r.id]}
                title="Oznacz jako zamknięte"
              >
                <LucideCheckCircle />
              </button>
            )}
            <button
              className="rounded-xl border border-white/10 bg-background-2 p-2 hover:border-red-500/30 hover:bg-red-600/10 disabled:opacity-60"
              onClick={() => updateStatus(r.id, "REJECTED")}
              disabled={busyIds[r.id]}
              title="Odrzuć"
            >
              <LucideXCircle />
            </button>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-background-3 p-4 text-foreground-2">
          Brak zgłoszeń pasujących do kryteriów.
        </div>
      )}

      {toastMessage && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 rounded-xl border border-white/10 bg-background-4/90 px-4 py-2 text-sm text-foreground shadow-2xl animate-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}



