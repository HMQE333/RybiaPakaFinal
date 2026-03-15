"use client";

import { LucideCheckCircle, LucideEye, LucideXCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { ReportStatus } from "@/lib/prismaEnums";

type ModerationRow = {
  id: string;
  title: string;
  excerpt?: string;
  type?: string;
  author?: string;
  targetType?: string | null;
  targetId?: string | null;
};

const deletableTargets = new Set([
  "thread",
  "post",
  "gallery-item",
  "gallery-comment",
]);

const canDeleteTarget = (row: ModerationRow) => {
  if (!row.targetId) return false;
  const targetType = (row.targetType ?? "").toLowerCase();
  return deletableTargets.has(targetType);
};

export default function ContentList({ items }: { items: ModerationRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<ModerationRow[]>(items);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sorted = useMemo(() => rows, [rows]);

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

      if (!res.ok) {
        toast("Nie udało się zapisać zmiany.");
        return;
      }

      setRows((prev) => prev.filter((row) => row.id !== reportId));
      toast(status === "REJECTED" ? "Zgłoszenie odrzucone." : "Zgłoszenie zamknięte.");
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
      setRows((prev) => prev.filter((row) => row.id !== reportId));
      toast("Treść usunięta.");
      router.refresh();
    } finally {
      setBusy(reportId, false);
    }
  };

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-background-3 p-4 text-foreground-2">
        Brak treści do moderacji.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {sorted.map((it) => (
        <div
          key={it.id}
          className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-background-3 p-4"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{it.title}</p>
            <p className="mt-1 text-sm text-foreground-2">
              {it.type ?? "Treść"}
              {it.author ? ` • Zgłoszone przez: ${it.author}` : ""}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-foreground-2">
              {it.excerpt || "Dodano do kolejki moderacji."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              className="rounded-xl border border-white/10 bg-background-2 px-3 py-2 text-sm text-foreground-2 hover:text-foreground disabled:opacity-60"
              onClick={() => router.push(`/administracja/zgloszenia/${it.id}`)}
              disabled={busyIds[it.id]}
            >
              <span className="inline-flex items-center gap-2">
                <LucideEye size={16} />Otwórz</span>
            </button>
            <button
              className="rounded-xl border border-white/10 bg-background-2 p-2 hover:border-accent/30 hover:bg-accent/10 disabled:opacity-60"
              onClick={() =>
                canDeleteTarget(it)
                  ? deleteTarget(it.id)
                  : updateStatus(it.id, "RESOLVED")
              }
              disabled={busyIds[it.id]}
              title="Usuń treść"
            >
              <LucideCheckCircle />
            </button>
            <button
              className="rounded-xl border border-white/10 bg-background-2 p-2 hover:border-red-500/30 hover:bg-red-600/10 disabled:opacity-60"
              onClick={() => updateStatus(it.id, "REJECTED")}
              disabled={busyIds[it.id]}
              title="Odrzuć zgłoszenie"
            >
              <LucideXCircle />
            </button>
          </div>
        </div>
      ))}

      {toastMessage && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 rounded-xl border border-white/10 bg-background-4/90 px-4 py-2 text-sm text-foreground shadow-2xl animate-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}





