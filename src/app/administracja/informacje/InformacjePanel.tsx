"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LucidePencil,
  LucidePlus,
  LucideRefreshCcw,
  LucideSave,
  LucideSearch,
  LucideTrash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAdminViewer } from "@/app/admin/components/AdminContext";
import { broadcastInfoUpdate } from "@/lib/informacjeEvents";
import {
  INFO_CATEGORY_KEYS,
  INFO_CATEGORY_LABELS,
  formatInfoDate,
  joinInfoContent,
  normalizeInfoDate,
  splitInfoContent,
  type InfoCategory,
  type InfoEntry,
} from "@/lib/informacjeTypes";
import { cn } from "@/utils";

type FormState = {
  title: string;
  summary: string;
  author: string;
  category: InfoCategory;
  highlight: string;
  publishedAt: string;
  content: string;
};

const buildEmptyForm = (author: string): FormState => ({
  title: "",
  summary: "",
  author,
  category: "ogloszenia",
  highlight: "",
  publishedAt: normalizeInfoDate(new Date()),
  content: "",
});

const mapEntryToForm = (entry: InfoEntry): FormState => ({
  title: entry.title,
  summary: entry.summary,
  author: entry.author,
  category: entry.category,
  highlight: entry.highlight ?? "",
  publishedAt: normalizeInfoDate(entry.publishedAt),
  content: joinInfoContent(entry.content ?? []),
});

export default function InformacjePanel() {
  const viewer = useAdminViewer();
  const router = useRouter();
  const defaultAuthor =
    viewer.username || viewer.nick || viewer.email.split("@")[0] || "Administrator";

  const [entries, setEntries] = useState<InfoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<InfoCategory | "all">(
    "all"
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => buildEmptyForm(defaultAuthor));
  const [saving, setSaving] = useState(false);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const trimmedQuery = query.trim();

  const toast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2400);
  };

  const resetForm = () => {
    setSelectedId(null);
    setForm(buildEmptyForm(defaultAuthor));
  };

  const applyEntry = (entry: InfoEntry) => {
    setSelectedId(entry.id);
    setForm(mapEntryToForm(entry));
  };

  const loadEntries = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/informacje", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("FAILED_TO_LOAD");
      }
      const data = await res.json().catch(() => null);
      const rows = Array.isArray(data?.entries) ? data.entries : [];
      setEntries(rows);
    } catch {
      setLoadError("Nie udało się wczytać wpisów.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = INFO_CATEGORY_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: 0 }),
      {} as Record<InfoCategory, number>
    );
    entries.forEach((entry) => {
      counts[entry.category] = (counts[entry.category] ?? 0) + 1;
    });
    return counts;
  }, [entries]);

  const filtered = useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    return entries.filter((entry) => {
      if (categoryFilter !== "all" && entry.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.author.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, entries, trimmedQuery]);

  const filterHint = useMemo(() => {
    const parts = [`${filtered.length} z ${entries.length} wpisów`];
    if (categoryFilter !== "all") {
      parts.push(INFO_CATEGORY_LABELS[categoryFilter]);
    }
    if (trimmedQuery) {
      parts.push(`"${trimmedQuery}"`);
    }
    return parts.join(" • ");
  }, [categoryFilter, entries.length, filtered.length, trimmedQuery]);

  const handleSave = async () => {
    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      author: form.author.trim() || defaultAuthor,
      category: form.category,
      highlight: form.highlight.trim(),
      publishedAt: form.publishedAt,
      content: splitInfoContent(form.content),
    };

    if (!payload.title) {
      toast("Podaj tytuł wpisu.");
      return;
    }
    if (!payload.summary && payload.content.length === 0) {
      toast("Dodaj opis lub treść wpisu.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        selectedId ? `/api/admin/informacje/${selectedId}` : "/api/admin/informacje",
        {
          method: selectedId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.entry) {
        toast("Nie udało się zapisać wpisu.");
        return;
      }
      if (Array.isArray(data?.entries)) {
        setEntries(data.entries);
      }
      applyEntry(data.entry as InfoEntry);
      toast("Zapisano wpis.");
      broadcastInfoUpdate();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Usunąć ten wpis?");
      if (!confirmed) return;
    }

    setBusyDeleteId(entryId);
    try {
      const res = await fetch(`/api/admin/informacje/${entryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast("Nie udało się usunąć wpisu.");
        return;
      }
      if (Array.isArray(data?.entries)) {
        setEntries(data.entries);
      } else {
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      }
      if (selectedId === entryId) {
        resetForm();
      }
      toast("Wpis usunięty.");
      broadcastInfoUpdate();
      router.refresh();
    } finally {
      setBusyDeleteId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <section className="rounded-2xl border border-white/10 bg-background-2 p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              Menu informacji
            </h2>
            <p className="text-xs text-foreground-2">{filterHint}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadEntries}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-xs text-foreground-2 hover:text-foreground"
            >
              <LucideRefreshCcw size={14} />
              Odśwież
            </button>
            <Link
              href="/informacje"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-xs text-foreground-2 hover:text-foreground"
            >
              Podgląd strony
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-2 px-3 py-2 text-sm text-black hover:bg-accent"
            >
              <LucidePlus size={16} />
              Nowy wpis
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-background-3 px-3 py-2">
            <LucideSearch size={16} className="text-foreground-2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj wpisu..."
              className="w-full bg-transparent text-[13px] text-foreground placeholder:text-foreground-2 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            aria-pressed={categoryFilter === "all"}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
              categoryFilter === "all"
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-white/10 bg-background-3 text-foreground-2 hover:border-accent/30 hover:text-foreground"
            )}
          >
            Wszystkie
            <span className="rounded-full border border-white/10 bg-background-2 px-2 py-[2px] text-[11px]">
              {entries.length}
            </span>
          </button>
          {INFO_CATEGORY_KEYS.map((key) => {
            const isActive = categoryFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryFilter(key)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
                  isActive
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-white/10 bg-background-3 text-foreground-2 hover:border-accent/30 hover:text-foreground"
                )}
              >
                {INFO_CATEGORY_LABELS[key]}
                <span className="rounded-full border border-white/10 bg-background-2 px-2 py-[2px] text-[11px]">
                  {categoryCounts[key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="rounded-xl border border-white/10 bg-background-3 p-4 text-sm text-foreground-2">
            Ładowanie wpisów...
          </div>
        )}

        {!loading && loadError && (
          <div className="rounded-xl border border-white/10 bg-background-3 p-4 text-sm text-foreground-2">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={loadEntries}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-background-2 px-3 py-2 text-sm text-foreground-2 hover:text-foreground"
            >
              <LucideRefreshCcw size={16} />
              Odśwież
            </button>
          </div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-background-3 p-4 text-sm text-foreground-2">
            Brak wpisów pasujących do filtra.
          </div>
        )}

        {!loading && !loadError && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((entry) => {
              const isActive = entry.id === selectedId;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "rounded-2xl border p-4 transition",
                    isActive
                      ? "border-accent/40 bg-background-3"
                      : "border-white/10 bg-background-3/70 hover:border-accent/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {entry.title}
                      </h3>
                      <p className="mt-1 text-xs text-foreground-2 line-clamp-2">
                        {entry.summary}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground-2">
                        {entry.highlight && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                            {entry.highlight}
                          </span>
                        )}
                        <span className="rounded-full border border-white/10 px-2 py-0.5">
                          {INFO_CATEGORY_LABELS[entry.category]}
                        </span>
                        <span className="rounded-full border border-white/10 px-2 py-0.5">
                          {formatInfoDate(entry.publishedAt)}
                        </span>
                        <span className="rounded-full border border-white/10 px-2 py-0.5">
                          {entry.author}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => applyEntry(entry)}
                        className="rounded-xl border border-white/10 bg-background-2 p-2 text-foreground-2 hover:text-foreground"
                        title="Edytuj"
                      >
                        <LucidePencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        disabled={busyDeleteId === entry.id}
                        className="rounded-xl border border-white/10 bg-background-2 p-2 text-foreground-2 hover:border-red-500/30 hover:text-red-300 disabled:opacity-60"
                        title="Usuń"
                      >
                        <LucideTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-background-2 p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Pulpit roboczy
            </h2>
            <p className="text-xs text-foreground-2">
              {selectedId ? "Edytujesz wpis." : "Tworzysz nowy wpis."}
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-xs text-foreground-2 hover:text-foreground"
          >
            Wyczyść
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
          className="space-y-3"
        >
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
              Tytuł
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
              Krótki opis
            </label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
                Autor
              </label>
              <input
                value={form.author}
                onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
                Data publikacji
              </label>
              <input
                type="date"
                value={form.publishedAt}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    publishedAt: normalizeInfoDate(e.target.value),
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
                Kategoria
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value as InfoCategory,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
              >
                {INFO_CATEGORY_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {INFO_CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
              Wyróżnienie (opcjonalne)
            </label>
              <input
                value={form.highlight}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, highlight: e.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
              Treść (nowy akapit = pusta linia)
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full resize-none rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-2 px-4 py-2 text-sm text-black hover:bg-accent disabled:opacity-60"
            >
              <LucideSave size={16} />
              {saving ? "Zapisywanie..." : "Zapisz wpis"}
            </button>
          </div>
        </form>
      </section>

      {toastMessage && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 rounded-xl border border-white/10 bg-background-4/90 px-4 py-2 text-sm text-foreground shadow-2xl animate-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
