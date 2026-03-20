"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Filter,
  Images,
  MessageSquare,
  Search,
  X,
} from "lucide-react";

import { cn } from "@/utils";
import { handleUploadImageError } from "@/lib/imageFallback";

type FilterOption = {
  id: string;
  name: string;
};

type SearchClientProps = {
  regions: FilterOption[];
  methods: FilterOption[];
};

type SearchResultThread = {
  id: number;
  title: string;
  excerpt: string;
  createdAt: string;
  board: string | null;
  comments: number;
  author: {
    name: string;
    avatarUrl: string | null;
  };
};

type SearchResultGallery = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string;
  createdAt: string;
  author: {
    name: string;
    avatarUrl: string | null;
  };
};

type SearchResults = {
  query: string;
  threads: SearchResultThread[];
  gallery: SearchResultGallery[];
};

type SectionCardProps = {
  title: string;
  count: number;
  icon: ComponentType<{ size?: number; className?: string }>;
  isLoading: boolean;
  emptyLabel: string;
  children?: ReactNode;
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;
const EXCERPT_LENGTH = 160;
const FALLBACK_AVATAR = "/artwork/avatar_default.svg";

const normalizeText = (value: string) =>
  value.trim().replace(/\s+/g, " ");

const clampText = (value: string, limit = EXCERPT_LENGTH) => {
  if (!value) return "";
  const normalized = normalizeText(value);
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trim()}...`;
};

const formatDate = (value: string | Date) => {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

function SectionCard({
  title,
  count,
  icon: Icon,
  isLoading,
  emptyLabel,
  children,
}: SectionCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-background-3/70 p-4 shadow-[0_12px_35px_rgba(0,0,0,0.3)]">
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_15%,rgba(0,206,0,0.12),transparent_45%)]" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground-2">
            <Icon size={14} className="text-accent" />
            <span>{title}</span>
          </div>
          <span className="text-xs text-foreground-2">{count}</span>
        </div>
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="rounded-xl border border-white/10 bg-background-2/70 px-3 py-4 text-xs text-foreground-2">
              Ładowanie wyników...
            </div>
          ) : count > 0 ? (
            children
          ) : (
            <div className="rounded-xl border border-white/10 bg-background-2/60 px-3 py-4 text-xs text-foreground-2">
              {emptyLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchClient({ regions, methods }: SearchClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [regionId, setRegionId] = useState(
    () => searchParams.get("region") ?? ""
  );
  const [methodId, setMethodId] = useState(
    () => searchParams.get("method") ?? ""
  );
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = useMemo(() => normalizeText(query), [query]);
  const canSearch = trimmedQuery.length >= MIN_QUERY_LENGTH;
  const hasFilters = Boolean(regionId || methodId);
  const threadResults = results?.threads ?? [];
  const galleryResults = results?.gallery ?? [];
  const totalResults = threadResults.length + galleryResults.length;

  const activeRegionLabel = useMemo(
    () => regions.find((region) => region.id === regionId)?.name ?? "",
    [regionId, regions]
  );
  const activeMethodLabel = useMemo(
    () => methods.find((method) => method.id === methodId)?.name ?? "",
    [methodId, methods]
  );

  useEffect(() => {
    const nextQuery = searchParams.get("q") ?? "";
    const nextRegion = searchParams.get("region") ?? "";
    const nextMethod = searchParams.get("method") ?? "";

    setQuery((prev) => (prev === nextQuery ? prev : nextQuery));
    setRegionId((prev) => (prev === nextRegion ? prev : nextRegion));
    setMethodId((prev) => (prev === nextMethod ? prev : nextMethod));
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (trimmedQuery) {
      nextParams.set("q", trimmedQuery);
    } else {
      nextParams.delete("q");
    }
    if (regionId) {
      nextParams.set("region", regionId);
    } else {
      nextParams.delete("region");
    }
    if (methodId) {
      nextParams.set("method", methodId);
    } else {
      nextParams.delete("method");
    }

    const nextQueryString = nextParams.toString();
    const currentQueryString = searchParams.toString();

    if (nextQueryString !== currentQueryString) {
      router.replace(
        nextQueryString ? `${pathname}?${nextQueryString}` : pathname,
        { scroll: false }
      );
    }
  }, [trimmedQuery, regionId, methodId, pathname, router, searchParams]);

  useEffect(() => {
    if (!canSearch) {
      setResults(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const nextQuery = trimmedQuery;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("q", nextQuery);
        if (regionId) params.set("region", regionId);
        if (methodId) params.set("method", methodId);

        const res = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("FAILED_TO_LOAD");
        }

        const data = (await res.json()) as SearchResults;
        if (!controller.signal.aborted) {
          setResults(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults(null);
          setError("Nie udało się wczytać wyników. Spróbuj ponownie.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [canSearch, methodId, regionId, trimmedQuery]);

  const clearAll = useCallback(() => {
    setQuery("");
    setRegionId("");
    setMethodId("");
  }, []);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3/90 via-background-2/90 to-background-3/80 p-6 sm:p-8 shadow-[0_12px_50px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_15%_20%,rgba(0,206,0,0.12),transparent_45%)]" />
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_85%_15%,rgba(0,150,255,0.12),transparent_50%)]" />
        <div className="relative space-y-3">
          <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-accent">
            Globalne wyszukiwanie
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            Wyszukiwarka forum i galerii
          </h1>
          <p className="text-sm text-foreground-2 max-w-2xl">
            Szukaj tematów i zdjęć w jednym miejscu. Filtruj po regionie
            i metodzie wędkowania, aby szybciej znaleźć to, czego szukasz.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-background-3/70 p-4 shadow-[0_12px_35px_rgba(0,0,0,0.3)]">
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-2"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj w forum i galerii..."
              className="w-full rounded-xl border border-white/10 bg-background-2/70 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-foreground-2/70 outline-none focus:border-accent/60"
            />
          </div>

          <select
            value={regionId}
            onChange={(event) => setRegionId(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-background-2/70 px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/60"
          >
            <option value="">Wszystkie regiony</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>

          <select
            value={methodId}
            onChange={(event) => setMethodId(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-background-2/70 px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/60"
          >
            <option value="">Wszystkie metody</option>
            {methods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearAll}
            disabled={!query.trim() && !regionId && !methodId}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] transition-colors",
              !query.trim() && !regionId && !methodId
                ? "cursor-not-allowed text-foreground-2/60"
                : "text-foreground-2 hover:text-accent hover:border-accent/40"
            )}
          >
            <X size={14} />
            Wyczyść
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground-2">
          <Filter size={14} className="text-accent" />
          {hasFilters ? (
            <>
              {activeRegionLabel && (
                <span className="rounded-full border border-white/10 bg-background-2/70 px-2 py-0.5">
                  Region: {activeRegionLabel}
                </span>
              )}
              {activeMethodLabel && (
                <span className="rounded-full border border-white/10 bg-background-2/70 px-2 py-0.5">
                  Metoda: {activeMethodLabel}
                </span>
              )}
            </>
          ) : (
            <span>Brak aktywnych filtrów</span>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!canSearch && !error && (
        <div className="rounded-2xl border border-white/10 bg-background-3/70 px-4 py-6 text-sm text-foreground-2">
          Wpisz minimum {MIN_QUERY_LENGTH} znaki, aby wyszukać w całej
          platformie.
        </div>
      )}

      {canSearch && !error && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-background-3/70 px-4 py-3 text-sm text-foreground-2">
            <div className="flex flex-wrap items-center gap-2">
              <span>Wyniki dla:</span>
              <span className="text-foreground font-semibold">
                {trimmedQuery}
              </span>
              {isLoading && (
                <span className="text-xs text-foreground-3">
                  Szukanie...
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-foreground-3">
              Forum: {threadResults.length} · Galeria: {galleryResults.length}
            </div>
          </div>

          {!isLoading && results && totalResults === 0 && (
            <div className="rounded-2xl border border-white/10 bg-background-3/70 px-4 py-6 text-sm text-foreground-2">
              Brak wyników. Spróbuj innej frazy lub zmień filtry.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Forum"
              count={threadResults.length}
              icon={MessageSquare}
              isLoading={isLoading && !results}
              emptyLabel="Brak wyników w forum."
            >
              {threadResults.map((thread) => {
                const excerpt = clampText(thread.excerpt);
                const createdAt = formatDate(thread.createdAt);
                return (
                  <Link
                    key={thread.id}
                    href={`/forum?watek=${thread.id}`}
                    className="group flex items-start gap-3 rounded-xl border border-white/10 bg-background-2/60 p-3 transition-colors hover:border-accent/40"
                  >
                    <img
                      src={thread.author.avatarUrl ?? FALLBACK_AVATAR}
                      alt={thread.author.name}
                      loading="lazy"
                      decoding="async"
                    className="h-10 w-10 rounded-full object-cover border border-white/10"
                    onError={(event) =>
                      handleUploadImageError(
                        event.currentTarget,
                        "/artwork/avatar_default.svg"
                      )
                    }
                  />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-2">
                        {thread.board && (
                          <span className="rounded-full border border-white/10 bg-background-3/70 px-2 py-0.5">
                            {thread.board}
                          </span>
                        )}
                        {createdAt && <span>{createdAt}</span>}
                        <span>Autor: {thread.author.name}</span>
                        <span>{thread.comments} komentarzy</span>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-foreground group-hover:text-accent line-clamp-2">
                        {thread.title}
                      </div>
                      {excerpt && (
                        <p className="mt-1 text-xs text-foreground-2 line-clamp-2">
                          {excerpt}
                        </p>
                      )}
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-foreground-3 group-hover:text-accent"
                    />
                  </Link>
                );
              })}
            </SectionCard>

            <SectionCard
              title="Galeria"
              count={galleryResults.length}
              icon={Images}
              isLoading={isLoading && !results}
              emptyLabel="Brak wyników w galerii."
            >
              {galleryResults.map((item) => {
                const description = clampText(item.description ?? "", 120);
                const createdAt = formatDate(item.createdAt);
                return (
                  <Link
                    key={item.id}
                    href={`/galeria?zdjecie=${encodeURIComponent(item.id)}`}
                    className="group flex items-start gap-3 rounded-xl border border-white/10 bg-background-2/60 p-3 transition-colors hover:border-accent/40"
                  >
                    <div className="h-14 w-20 overflow-hidden rounded-lg border border-white/10 bg-background-3/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                        onError={(event) =>
                          handleUploadImageError(
                            event.currentTarget,
                            "/artwork/404_post.png"
                          )
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-2">
                        <span className="rounded-full border border-white/10 bg-background-3/70 px-2 py-0.5">
                          {item.category}
                        </span>
                        {createdAt && <span>{createdAt}</span>}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-foreground group-hover:text-accent line-clamp-2">
                        {item.title}
                      </div>
                      {description && (
                        <p className="mt-1 text-xs text-foreground-2 line-clamp-2">
                          {description}
                        </p>
                      )}
                      <div className="mt-1 text-[11px] text-foreground-2">
                        Autor: {item.author.name}
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-foreground-3 group-hover:text-accent"
                    />
                  </Link>
                );
              })}
            </SectionCard>

          </div>
        </section>
      )}
    </div>
  );
}






