"use client";

import { useState } from "react";

type ContentArchiveRow = {
  id: string;
  targetType: string;
  targetId: string;
  author: string;
  reporter: string;
  admin: string;
  createdAt: string;
  deletedAt: string;
  expiresAt: string;
  restoredAt: string | null;
};

function typeLabel(type: string) {
  switch (type.toLowerCase()) {
    case "thread":
      return "Wątek";
    case "post":
      return "Komentarz";
    case "gallery-item":
      return "Zdjęcie";
    case "gallery-comment":
      return "Komentarz (galeria)";
    case "channel-message":
      return "Wiadomosc (czat)";
    default:
      return type;
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pl-PL");
}

export default function ArchiveList({ items }: { items: ContentArchiveRow[] }) {
  const [rows, setRows] = useState<ContentArchiveRow[]>(items);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const now = new Date();

  const toast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2400);
  };

  const setBusy = (id: string, value: boolean) =>
    setBusyIds((prev) => ({ ...prev, [id]: value }));

  const restoreItem = async (id: string) => {
    setBusy(id, true);
    try {
      const res = await fetch(`/api/admin/archive/${id}/restore`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        toast("Nie udało się przywrócić treści.");
        return;
      }
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, restoredAt: new Date().toISOString() } : row
        )
      );
      toast("Treść przywrócona.");
    } finally {
      setBusy(id, false);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-background-3 p-4 text-foreground-2">
        Brak wpisów w archiwum.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {rows.map((row) => {
          const expiresAt = new Date(row.expiresAt);
          const isExpired = Number.isNaN(expiresAt.getTime())
            ? true
            : expiresAt.getTime() <= now.getTime();
          const isRestored = Boolean(row.restoredAt);
          const canRestore = !isExpired && !isRestored;

          return (
            <div
              key={row.id}
              className="rounded-2xl border border-white/10 bg-background-2 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 text-sm">
                  <div className="text-foreground">
                    {row.author} - {typeLabel(row.targetType)}
                  </div>
                  <div className="text-foreground-2">
                    Dodano: {formatDate(row.createdAt)}
                  </div>
                  <div className="text-foreground-2">
                    Usunięto: {formatDate(row.deletedAt)}
                  </div>
                  <div className="text-foreground-2">
                    Wygasa: {formatDate(row.expiresAt)}
                  </div>
                  <div className="text-foreground-2">
                    Administrator: {row.admin}
                  </div>
                  <div className="text-foreground-2">
                    Zgłaszający: {row.reporter || "Anonim"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isRestored ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                      Przywrócono
                    </span>
                  ) : isExpired ? (
                    <span className="rounded-full border border-white/10 bg-background-3 px-3 py-1 text-xs text-foreground-2">
                      Wygasło
                    </span>
                  ) : (
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
                      Aktywne
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => restoreItem(row.id)}
                    disabled={!canRestore || busyIds[row.id]}
                    className="rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-xs text-foreground-2 hover:text-foreground disabled:opacity-60"
                  >
                    Przywróć
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {toastMessage && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 rounded-xl border border-white/10 bg-background-4/90 px-4 py-2 text-sm text-foreground shadow-2xl animate-toast">
          {toastMessage}
        </div>
      )}
    </>
  );
}
