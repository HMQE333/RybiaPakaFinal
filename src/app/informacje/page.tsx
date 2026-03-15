"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Megaphone,
  Newspaper,
  Sparkles,
  Users,
  Wrench,
  Calendar,
} from "lucide-react";

import Logo from "@/components/Logo";
import Page from "@/components/Page";
import { cn } from "@/utils";
import { subscribeInfoUpdates } from "@/lib/informacjeEvents";
import {
  formatInfoDate,
  INFO_CATEGORY_DESCRIPTIONS,
  INFO_CATEGORY_KEYS,
  INFO_CATEGORY_LABELS,
  type InfoCategory,
  type InfoEntry,
} from "@/lib/informacjeTypes";

const CATEGORY_ICONS: Record<InfoCategory, React.ReactNode> = {
  ogloszenia: <Megaphone size={16} />,
  aktualnosci: <Newspaper size={16} />,
  konkursy: <Sparkles size={16} />,
  wydarzenia: <Users size={16} />,
  kulisy: <Wrench size={16} />,
};

const categories = INFO_CATEGORY_KEYS.map((key) => ({
  key,
  title: INFO_CATEGORY_LABELS[key],
  description: INFO_CATEGORY_DESCRIPTIONS[key],
  icon: CATEGORY_ICONS[key],
}));


export default function InformacjePage() {
  const [activeKey, setActiveKey] = useState<InfoCategory>("ogloszenia");
  const [entries, setEntries] = useState<InfoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadEntries = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const res = await fetch("/api/informacje", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("FAILED_TO_LOAD");
      }
      const data = await res.json().catch(() => null);
      setEntries(Array.isArray(data?.entries) ? data.entries : []);
    } catch {
      if (!silent) {
        setLoadError("Nie udało się wczytać wpisów.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    return subscribeInfoUpdates(() => {
      loadEntries({ silent: true });
    });
  }, [loadEntries]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadEntries({ silent: true });
    }, 30000);
    return () => window.clearInterval(interval);
  }, [loadEntries]);

  const categoryCounts = useMemo(() => {
    const counts: Record<InfoCategory, number> = {
      ogloszenia: 0,
      aktualnosci: 0,
      konkursy: 0,
      wydarzenia: 0,
      kulisy: 0,
    };
    entries.forEach((entry) => {
      counts[entry.category] = (counts[entry.category] || 0) + 1;
    });
    return counts;
  }, [entries]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aTime = Date.parse(a.publishedAt);
      const bTime = Date.parse(b.publishedAt);
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });
  }, [entries]);

  const visibleEntries = sortedEntries.filter(
    (entry) => entry.category === activeKey
  );
  const activeCategory = categories.find((cat) => cat.key === activeKey);
  const [openedEntry, setOpenedEntry] = useState<InfoEntry | null>(null);

  useEffect(() => {
    if (!openedEntry) return;
    if (!entries.some((entry) => entry.id === openedEntry.id)) {
      setOpenedEntry(null);
    }
  }, [entries, openedEntry]);

  return (
    <Page>
      <main className="w-full flex flex-col items-center pt-[180px] pb-16 px-4">
        <section className="w-full max-w-6xl space-y-10">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3 via-background-2 to-background-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)] px-6 md:px-10 py-10">
            <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_15%_20%,rgba(0,206,0,0.12),transparent_40%)]" />
            <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_85%_10%,rgba(0,133,0,0.14),transparent_40%)]" />
            <div className="relative grid grid-cols-1 gap-8 items-center">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-foreground-2">
                  <span className="px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent">
                    Centrum informacji
                  </span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Najważniejsze informacje
                  </h1>
                  <p className="text-base text-foreground-2 leading-relaxed max-w-3xl">
                    Wszystkie ogłoszenia, aktualności i konkursy w jednym
                    miejscu. Ten sam vibe co dyskusje: proste tagi i przejrzyste
                    karty.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-foreground-2">
                    <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                      Czytelne tagi
                    </span>
                    <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                      Szybkie info
                    </span>
                    <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                      Spójny kolor
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-background-3/80 shadow-[0_16px_50px_rgba(0,0,0,0.28)] p-5 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-foreground-2">
                <Sparkles size={16} className="text-accent" />
                <span>
                  Wybierz kategorię, a niżej pokażemy powiązane wpisy.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isActive = cat.key === activeKey;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveKey(cat.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                      isActive
                        ? "border-accent text-accent bg-accent/10 shadow-[0_10px_30px_rgba(0,206,0,0.15)]"
                        : "border-background-4 text-foreground-2 bg-background hover:border-accent/50 hover:text-foreground"
                    )}
                  >
                    {cat.icon}
                    <span>{cat.title}</span>
                    <span className="text-[11px] text-foreground-2 rounded-full bg-background-3 px-2 py-[2px] border border-background-4">
                      {categoryCounts[cat.key] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <section className="space-y-4">
            {activeCategory && (
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
                  {activeCategory.icon}
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.16em] text-foreground-2">
                    {activeCategory.title}
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground">
                    Wybrane wpisy
                  </h2>
                  <p className="text-sm text-foreground-2">
                    {activeCategory.description}
                  </p>
                </div>
              </div>
            )}
            {loading && (
              <div className="rounded-2xl border border-background-4 bg-background-3 p-6 text-sm text-foreground-2">
                Ładowanie wpisów...
              </div>
            )}

            {!loading && loadError && (
              <div className="rounded-2xl border border-background-4 bg-background-3 p-6 text-sm text-foreground-2">
                <p>{loadError}</p>
                <button
                  type="button"
                  onClick={() => loadEntries()}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-background-4 px-3 py-1 text-xs text-foreground-2 hover:text-foreground"
                >
                  <ArrowRight size={12} />
                  Spróbuj ponownie
                </button>
              </div>
            )}

            {!loading && !loadError && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleEntries.map((entry) => (
                    <article
                      key={entry.id}
                      onClick={() => setOpenedEntry(entry)}
                      className="rounded-2xl border border-background-4 bg-background-3/70 p-5 shadow-lg interactive-card cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-2 mb-3">
                        {entry.highlight && (
                          <span className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold text-accent">
                            {entry.highlight}
                          </span>
                        )}
                        <span className="rounded-full border border-background-4 px-3 py-1">
                          {categories.find((c) => c.key === entry.category)?.title}
                        </span>
                        <span className="flex items-center gap-1 rounded-full border border-background-4 px-3 py-1">
                          <Calendar size={12} />
                          {formatInfoDate(entry.publishedAt)}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-foreground leading-tight mb-2">
                        {entry.title}
                      </h3>
                      <p className="text-sm text-foreground-2 mb-4">
                        {entry.summary}
                      </p>

                      <div className="flex items-center justify-between text-xs text-foreground-2">
                        <span className="flex items-center gap-1">
                          Dodane przez:
                          <span className="text-accent font-semibold">
                            {entry.author}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-foreground">
                          Podgląd
                          <ArrowRight size={14} className="text-accent" />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                {visibleEntries.length === 0 && (
                  <div className="rounded-2xl border border-background-4 bg-background-3 p-6 text-sm text-foreground-2">
                    Brak wpisów w tej kategorii (jeszcze!).
                  </div>
                )}
              </>
            )}
          </section>
        </section>
      </main>

      {openedEntry && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3 via-background-2 to-background-3 shadow-2xl modal-pop">
            <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_12%_18%,rgba(0,206,0,0.12),transparent_40%)]" />
            <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_88%_12%,rgba(0,133,0,0.14),transparent_40%)]" />

            <div className="relative flex items-start justify-between gap-3 border-b border-white/10 px-6 md:px-8 py-4">
              <div className="flex items-center gap-3">
                <Logo size={46} />
                <div className="flex flex-col leading-tight">
                  <span className="text-xs uppercase tracking-[0.16em] text-foreground-2">
                    RybiaPaka.pl
                  </span>
                  <span className="text-xs text-accent">
                    Informacje — podgląd wpisu
                  </span>
                </div>
              </div>
              <button
                onClick={() => setOpenedEntry(null)}
                className="rounded-full border border-background-4 bg-background-3/70 h-9 w-9 flex items-center justify-center text-foreground transition hover:border-accent hover:text-accent"
                aria-label="Zamknij"
              >
                ×
              </button>
            </div>

            <div className="relative px-6 md:px-8 py-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-2">
                {openedEntry.highlight && (
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold text-accent shimmer-accent">
                    {openedEntry.highlight}
                  </span>
                )}
                <span className="rounded-full border border-background-4 px-3 py-1">
                  {
                    categories.find((c) => c.key === openedEntry.category)
                      ?.title
                  }
                </span>
                <span className="rounded-full border border-background-4 px-3 py-1">
                  {formatInfoDate(openedEntry.publishedAt)}
                </span>
                <span className="rounded-full border border-background-4 px-3 py-1">
                  Dodane przez:{" "}
                  <span className="text-accent font-semibold">
                    {openedEntry.author}
                  </span>
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight animate-like">
                {openedEntry.title}
              </h3>

              <div className="space-y-3 text-sm md:text-base text-foreground-2 leading-relaxed">
                {openedEntry.content.map((paragraph) => (
                  <p key={paragraph} className="animate-toast">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}










