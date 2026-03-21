"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import {
  Search,
  Fish,
  Star,
  Clock,
  Trophy,
  SlidersHorizontal,
  X,
  MapPin,
  Flame,
  Zap,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/utils";
import SpotDetailPanel from "./SpotDetailPanel";
import { MOCK_SPOTS, TYPE_CONFIG } from "./mockData";
import type { MockSpot, SpotType } from "./mockData";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

const VOIVODESHIPS = [
  "Wszystkie",
  "Dolnośląskie",
  "Kujawsko-Pomorskie",
  "Lubelskie",
  "Lubuskie",
  "Łódzkie",
  "Małopolskie",
  "Mazowieckie",
  "Opolskie",
  "Podkarpackie",
  "Podlaskie",
  "Pomorskie",
  "Śląskie",
  "Świętokrzyskie",
  "Warmińsko-Mazurskie",
  "Wielkopolskie",
  "Zachodniopomorskie",
];

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      <Star size={11} className="fill-amber-400 text-amber-400" />
      <span className="text-xs font-semibold text-amber-400">{value.toFixed(1)}</span>
    </span>
  );
}

function SpotCard({
  spot,
  selected,
  onClick,
}: {
  spot: MockSpot;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = TYPE_CONFIG[spot.type];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 flex gap-3 items-start transition-all border-b border-white/5 hover:bg-white/4",
        selected && "bg-accent/6 border-l-2 border-l-accent hover:bg-accent/8"
      )}
    >
      {/* Color strip */}
      <div
        className="mt-1 h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-background-2"
        style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.color}80` }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p
            className={cn(
              "text-sm font-semibold leading-tight truncate transition-colors",
              selected ? "text-accent" : "text-foreground"
            )}
          >
            {spot.name}
          </p>
          <StarDisplay value={spot.rating} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-[10px] font-medium rounded-full px-1.5 py-0.5 border"
            style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
          >
            {cfg.label}
          </span>
          <span className="text-[11px] text-foreground-2 truncate">{spot.voivodeship}</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-foreground-2/70">
            <Fish size={9} className="text-accent/70" />
            {spot.fishSpecies.slice(0, 2).join(", ")}
            {spot.fishSpecies.length > 2 && ` +${spot.fishSpecies.length - 2}`}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-foreground-2/70">
            <Clock size={9} />
            {spot.lastActivity}
          </span>
        </div>
      </div>
    </button>
  );
}

type SortMode = "aktywnosc" | "ocena" | "opinie";

export default function MapClient() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SpotType | null>(null);
  const [voivodeshipFilter, setVoivodeshipFilter] = useState("Wszystkie");
  const [sortMode, setSortMode] = useState<SortMode>("aktywnosc");
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<"lista" | "mapa">("mapa");

  const selectedSpot = useMemo(
    () => MOCK_SPOTS.find((s) => s.id === selectedId) ?? null,
    [selectedId]
  );

  const filteredSpots = useMemo(() => {
    let spots = MOCK_SPOTS;
    if (search.trim()) {
      const q = search.toLowerCase();
      spots = spots.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.voivodeship.toLowerCase().includes(q) ||
          s.fishSpecies.some((f) => f.toLowerCase().includes(q))
      );
    }
    if (typeFilter) spots = spots.filter((s) => s.type === typeFilter);
    if (voivodeshipFilter !== "Wszystkie")
      spots = spots.filter((s) => s.voivodeship === voivodeshipFilter);

    switch (sortMode) {
      case "ocena":
        return [...spots].sort((a, b) => b.rating - a.rating);
      case "opinie":
        return [...spots].sort((a, b) => b.reviewCount - a.reviewCount);
      default:
        return spots;
    }
  }, [search, typeFilter, voivodeshipFilter, sortMode]);

  const topRated = useMemo(
    () => [...MOCK_SPOTS].sort((a, b) => b.rating - a.rating).slice(0, 3),
    []
  );
  const recentlyActive = useMemo(() => MOCK_SPOTS.slice(0, 3), []);

  const handleSelectSpot = useCallback((id: string) => {
    setSelectedId(id);
    setMobileTab("mapa");
  }, []);

  const handleClosePanel = useCallback(() => setSelectedId(null), []);

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* ── SIDEBAR ────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "relative z-10 flex flex-col h-full bg-background-2 border-r border-white/8 transition-all duration-300 shrink-0",
          "hidden lg:flex",
          sidebarOpen ? "w-[340px]" : "w-0 overflow-hidden pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full min-w-[340px]">
          {/* Header */}
          <div className="px-4 pt-4 pb-0 border-b border-white/8">
            {/* Title */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 border border-accent/30">
                <Fish size={14} className="text-accent" />
              </div>
              <h1 className="text-sm font-bold text-foreground">Łowiska</h1>
              <span className="ml-auto text-xs text-foreground-2 bg-white/5 border border-white/8 rounded-full px-2 py-0.5">
                {filteredSpots.length}
              </span>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-2" />
              <input
                type="text"
                placeholder="Szukaj łowiska, gatunku..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-background-3/60 pl-8 pr-8 py-2 text-xs text-foreground placeholder:text-foreground-2/50 focus:border-accent/50 focus:outline-none transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-2 hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Type filter tabs */}
            <div className="flex gap-1.5 mb-3">
              <button
                onClick={() => setTypeFilter(null)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-all border",
                  typeFilter === null
                    ? "border-white/20 bg-white/8 text-foreground"
                    : "border-white/8 text-foreground-2 hover:border-white/15"
                )}
              >
                Wszystkie
              </button>
              {(Object.keys(TYPE_CONFIG) as SpotType[]).map((t) => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter((prev) => (prev === t ? null : t))}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-all border"
                    )}
                    style={
                      typeFilter === t
                        ? {
                            backgroundColor: cfg.bg,
                            borderColor: cfg.border,
                            color: cfg.color,
                          }
                        : {
                            borderColor: "rgba(255,255,255,0.08)",
                            color: "#99a1af",
                          }
                    }
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex w-full items-center justify-between py-2 text-xs text-foreground-2 hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal size={11} />
                Filtry zaawansowane
              </span>
              <ChevronDown
                size={12}
                className={cn("transition-transform", showFilters && "rotate-180")}
              />
            </button>

            {/* Advanced filters */}
            {showFilters && (
              <div className="pb-3 space-y-2">
                <div>
                  <label className="text-[10px] text-foreground-2 uppercase tracking-wider block mb-1">
                    Województwo
                  </label>
                  <select
                    value={voivodeshipFilter}
                    onChange={(e) => setVoivodeshipFilter(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-background-3/60 px-3 py-1.5 text-xs text-foreground focus:border-accent/50 focus:outline-none appearance-none"
                  >
                    {VOIVODESHIPS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-foreground-2 uppercase tracking-wider block mb-1">
                    Sortuj według
                  </label>
                  <div className="flex gap-1.5">
                    {(
                      [
                        { value: "aktywnosc", label: "Aktywność", icon: <Zap size={10} /> },
                        { value: "ocena", label: "Ocena", icon: <Star size={10} /> },
                        { value: "opinie", label: "Opinie", icon: <Trophy size={10} /> },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSortMode(opt.value)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] border transition-all",
                          sortMode === opt.value
                            ? "border-accent/40 bg-accent/12 text-accent"
                            : "border-white/8 text-foreground-2 hover:border-white/15"
                        )}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List / Featured sections */}
          <div className="flex-1 overflow-y-auto">
            {!search && !typeFilter && voivodeshipFilter === "Wszystkie" && (
              <>
                {/* Top rated */}
                <div className="px-4 pt-4 pb-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground-2 uppercase tracking-wider">
                    <Trophy size={10} className="text-amber-400" />
                    Najlepiej oceniane
                  </p>
                </div>
                {topRated.map((spot) => (
                  <SpotCard
                    key={spot.id}
                    spot={spot}
                    selected={spot.id === selectedId}
                    onClick={() => handleSelectSpot(spot.id)}
                  />
                ))}

                {/* Recently active */}
                <div className="px-4 pt-4 pb-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground-2 uppercase tracking-wider">
                    <Flame size={10} className="text-accent" />
                    Ostatnio aktywne
                  </p>
                </div>
                {recentlyActive.map((spot) => (
                  <SpotCard
                    key={spot.id}
                    spot={spot}
                    selected={spot.id === selectedId}
                    onClick={() => handleSelectSpot(spot.id)}
                  />
                ))}

                <div className="px-4 pt-4 pb-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground-2 uppercase tracking-wider">
                    <MapPin size={10} className="text-foreground-2" />
                    Wszystkie łowiska
                  </p>
                </div>
              </>
            )}

            {filteredSpots.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-foreground-2">
                <MapPin size={28} className="opacity-20" />
                <p className="text-xs text-center">Brak łowisk dla wybranych filtrów.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setTypeFilter(null);
                    setVoivodeshipFilter("Wszystkie");
                  }}
                  className="text-xs text-accent hover:underline"
                >
                  Wyczyść filtry
                </button>
              </div>
            ) : (
              filteredSpots.map((spot) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  selected={spot.id === selectedId}
                  onClick={() => handleSelectSpot(spot.id)}
                />
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ── SIDEBAR TOGGLE BUTTON (desktop) ────────────────────────── */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className={cn(
          "hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 h-10 w-4 items-center justify-center rounded-r-lg border border-l-0 border-white/10 bg-background-2 text-foreground-2 hover:text-foreground transition-all shadow-xl",
          sidebarOpen ? "left-[340px]" : "left-0"
        )}
        style={{ transition: "left 0.3s" }}
      >
        <svg
          width="6"
          height="10"
          viewBox="0 0 6 10"
          className={cn("transition-transform", !sidebarOpen && "rotate-180")}
        >
          <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {/* ── MAP ────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative flex-1 h-full",
          mobileTab === "lista" && "hidden lg:block"
        )}
      >
        <MapView
          spots={filteredSpots}
          selectedId={selectedId}
          onSelectSpot={handleSelectSpot}
        />

        {/* Spot count badge on map */}
        <div className="absolute bottom-6 left-4 z-10 rounded-xl border border-white/10 bg-background-2/85 backdrop-blur-md px-3 py-1.5 text-xs text-foreground-2 shadow-lg hidden lg:block">
          <span className="font-semibold text-foreground">{filteredSpots.length}</span> łowisk na mapie
        </div>

        {/* Map legend */}
        <div className="absolute top-4 right-4 z-10 rounded-xl border border-white/10 bg-background-2/85 backdrop-blur-md p-2.5 shadow-lg space-y-1.5">
          {(Object.keys(TYPE_CONFIG) as SpotType[]).map((t) => {
            const cfg = TYPE_CONFIG[t];
            return (
              <div key={t} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: cfg.color, boxShadow: `0 0 4px ${cfg.color}80` }}
                />
                <span className="text-[11px] text-foreground-2">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DETAIL PANEL (desktop slide-in) ────────────────────────── */}
      <div
        className={cn(
          "hidden lg:flex absolute right-0 top-0 h-full z-30 flex-col",
          "bg-background-2 border-l border-white/10 shadow-[-20px_0_60px_rgba(0,0,0,0.5)]",
          "transition-all duration-300 ease-in-out overflow-hidden",
          selectedSpot ? "w-[400px] opacity-100" : "w-0 opacity-0 pointer-events-none"
        )}
      >
        {selectedSpot && (
          <SpotDetailPanel spot={selectedSpot} onClose={handleClosePanel} />
        )}
      </div>

      {/* ── MOBILE BOTTOM SHEET (spot detail) ──────────────────────── */}
      {selectedSpot && (
        <div className="lg:hidden absolute inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-white/10 bg-background-2 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col max-h-[75vh]">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>
          <SpotDetailPanel spot={selectedSpot} onClose={handleClosePanel} />
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ──────────────────────────────────────── */}
      <div className="lg:hidden absolute bottom-0 inset-x-0 z-30 flex border-t border-white/10 bg-background-2/95 backdrop-blur-xl">
        {/* Search mobile */}
        <div className="flex-1 px-3 py-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-2" />
            <input
              type="text"
              placeholder="Szukaj..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-background-3 pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-foreground-2/50 focus:border-accent/50 focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => setMobileTab((t) => (t === "lista" ? "mapa" : "lista"))}
          className="shrink-0 flex flex-col items-center justify-center gap-0.5 px-4 border-l border-white/8"
        >
          {mobileTab === "mapa" ? (
            <>
              <Fish size={16} className="text-foreground-2" />
              <span className="text-[10px] text-foreground-2">Lista</span>
            </>
          ) : (
            <>
              <MapPin size={16} className="text-foreground-2" />
              <span className="text-[10px] text-foreground-2">Mapa</span>
            </>
          )}
        </button>
      </div>

      {/* ── MOBILE LIST VIEW ───────────────────────────────────────── */}
      {mobileTab === "lista" && (
        <div className="lg:hidden absolute inset-0 z-20 bg-background-2 overflow-y-auto pb-16">
          <div className="px-4 pt-4 pb-2">
            <div className="flex gap-1.5 mb-3">
              <button
                onClick={() => setTypeFilter(null)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-[11px] border",
                  typeFilter === null
                    ? "border-white/20 bg-white/8 text-foreground"
                    : "border-white/8 text-foreground-2"
                )}
              >
                Wszystkie
              </button>
              {(Object.keys(TYPE_CONFIG) as SpotType[]).map((t) => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter((prev) => (prev === t ? null : t))}
                    className="flex-1 rounded-lg py-1.5 text-[11px] border"
                    style={
                      typeFilter === t
                        ? { backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }
                        : { borderColor: "rgba(255,255,255,0.08)", color: "#99a1af" }
                    }
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          {filteredSpots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              selected={spot.id === selectedId}
              onClick={() => handleSelectSpot(spot.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
