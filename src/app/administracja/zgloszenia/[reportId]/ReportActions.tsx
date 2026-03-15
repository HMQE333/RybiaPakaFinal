"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReportStatus } from "@/lib/prismaEnums";

export default function ReportActions({
  reportId,
  status,
  canDeleteTarget = false,
}: {
  reportId: string;
  status: ReportStatus;
  canDeleteTarget?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2400);
  };

  const setStatus = async (nextStatus: ReportStatus) => {
    if (saving) return;
    if (nextStatus === status) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        toast("Nie udało się zapisać statusu.");
        return;
      }
      toast("Status zaktualizowany.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const deleteTarget = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        toast("Nie udało się usunąć treści.");
        return;
      }
      toast("Treść usunięta.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatus("IN_REVIEW")}
          disabled={saving}
          className="rounded-xl border border-white/10 bg-background-3 px-4 py-2 text-sm text-foreground-2 hover:text-foreground disabled:opacity-60"
        >
          W toku
        </button>
        {canDeleteTarget ? (
          <button
            type="button"
            onClick={deleteTarget}
            disabled={saving}
            className="rounded-xl bg-red-500/90 px-4 py-2 text-sm text-white hover:bg-red-500 disabled:opacity-60"
          >Usuń</button>
        ) : (
          <button
            type="button"
            onClick={() => setStatus("RESOLVED")}
            disabled={saving}
            className="rounded-xl bg-accent-2 px-4 py-2 text-sm text-black hover:bg-accent disabled:opacity-60"
          >
            Zamknij
          </button>
        )}
        <button
          type="button"
          onClick={() => setStatus("REJECTED")}
          disabled={saving}
          className="rounded-xl border border-red-500/30 bg-red-600/10 px-4 py-2 text-sm text-red-200 hover:bg-red-600/20 disabled:opacity-60"
        >Odrzuć</button>
      </div>

      {toastMessage && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 rounded-xl border border-white/10 bg-background-4/90 px-4 py-2 text-sm text-foreground shadow-2xl animate-toast">
          {toastMessage}
        </div>
      )}
    </>
  );
}

