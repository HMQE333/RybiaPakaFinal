"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapPin,
  Fish,
  X,
  Plus,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Waves,
} from "lucide-react";
import { cn } from "@/utils";
import type { FishingSpot } from "./MapView";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

const SPOT_TYPES = [
  { value: "rzeka", label: "Rzeka", color: "#3b82f6" },
  { value: "jezioro", label: "Jezioro", color: "#06b6d4" },
  { value: "zbiornik", label: "Zbiornik", color: "#8b5cf6" },
  { value: "morze", label: "Morze", color: "#0ea5e9" },
  { value: "staw", label: "Staw", color: "#22c55e" },
  { value: "inne", label: "Inne", color: "#f59e0b" },
];

function typeColor(type: string | null) {
  return SPOT_TYPES.find((t) => t.value === type)?.color ?? "#f59e0b";
}

function typeLabel(type: string | null) {
  return SPOT_TYPES.find((t) => t.value === type)?.label ?? "Inne";
}

type Props = {
  initialSpots: FishingSpot[];
  isLoggedIn: boolean;
};

export default function MapClient({ initialSpots, isLoggedIn }: Props) {
  const [spots, setSpots] = useState<FishingSpot[]>(initialSpots);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "inne",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!addMode) return;
      setPendingCoords({ lat, lng });
    },
    [addMode]
  );

  const filteredSpots = spots.filter((s) => {
    if (
      search.trim() &&
      !s.name.toLowerCase().includes(search.trim().toLowerCase())
    )
      return false;
    if (typeFilter && s.type !== typeFilter) return false;
    return true;
  });

  const cancelAdd = () => {
    setAddMode(false);
    setPendingCoords(null);
    setForm({ name: "", description: "", type: "inne" });
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!pendingCoords) {
      setSaveError("Kliknij na mapie, aby wybrać lokalizację łowiska.");
      return;
    }
    if (!form.name.trim() || form.name.trim().length < 2) {
      setSaveError("Nazwa łowiska musi mieć co najmniej 2 znaki.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/mapa-lowisk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          type: form.type,
          lat: pendingCoords.lat,
          lng: pendingCoords.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs: Record<string, string> = {
          INVALID_NAME: "Nazwa jest za krótka lub za długa (2–100 znaków).",
          INVALID_COORDS: "Nieprawidłowe współrzędne.",
          COORDS_OUT_OF_POLAND:
            "Łowisko musi znajdować się na terenie Polski.",
          UNAUTHORIZED: "Musisz być zalogowany, aby dodać łowisko.",
        };
        setSaveError(msgs[data?.error] ?? "Błąd podczas zapisywania.");
        return;
      }
      setSpots((prev) => [data.spot, ...prev]);
      cancelAdd();
    } catch {
      setSaveError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar toggle (mobile/collapsed) */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className={cn(
          "absolute z-20 top-1/2 -translate-y-1/2 flex h-8 w-5 items-center justify-center rounded-r-lg border border-l-0 border-white/10 bg-background-2 text-foreground-2 hover:text-foreground transition-all shadow-lg",
          sidebarOpen ? "left-[320px]" : "left-0"
        )}
        style={{ transition: "left 0.25s" }}
        aria-label={sidebarOpen ? "Zwiń panel" : "Rozwiń panel"}
      >
        {sidebarOpen ? (
          <ChevronLeft size={14} />
        ) : (
          <ChevronRight size={14} />
        )}
      </button>

      {/* Left sidebar */}
      <aside
        className={cn(
          "relative z-10 flex flex-col h-full bg-background-2 border-r border-white/8 transition-all duration-250 shrink-0",
          sidebarOpen ? "w-[320px]" : "w-0 overflow-hidden"
        )}
      >
        <div className="flex flex-col h-full min-w-[320px]">
          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Fish size={18} className="text-accent" />
                <h1 className="text-sm font-semibold text-foreground">
                  Łowiska
                </h1>
              </div>
              <span className="text-xs text-foreground-2">
                {filteredSpots.length}{" "}
                {filteredSpots.length === 1 ? "łowisko" : "łowisk"}
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-2"
              />
              <input
                type="text"
                placeholder="Szukaj łowiska..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-background-3/60 pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-foreground-2/60 focus:border-accent/50 focus:outline-none"
              />
            </div>

            {/* Type filters */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => setTypeFilter(null)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] border transition-colors",
                  typeFilter === null
                    ? "border-accent/50 bg-accent/15 text-accent"
                    : "border-white/10 text-foreground-2 hover:border-white/20"
                )}
              >
                Wszystkie
              </button>
              {SPOT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() =>
                    setTypeFilter((prev) =>
                      prev === t.value ? null : t.value
                    )
                  }
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] border transition-colors",
                    typeFilter === t.value
                      ? "border-white/20 text-white"
                      : "border-white/10 text-foreground-2 hover:border-white/20"
                  )}
                  style={
                    typeFilter === t.value
                      ? { backgroundColor: t.color + "33", borderColor: t.color + "66", color: t.color }
                      : {}
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Spots list */}
          <div className="flex-1 overflow-y-auto">
            {filteredSpots.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-foreground-2">
                <MapPin size={28} className="opacity-30" />
                <p className="text-xs">
                  {spots.length === 0
                    ? "Brak łowisk. Bądź pierwszy i dodaj swoje!"
                    : "Brak wyników dla wybranych filtrów."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {filteredSpots.map((spot) => (
                  <li
                    key={spot.id}
                    className="px-4 py-3 hover:bg-white/4 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-0.5 h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: typeColor(spot.type) }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground leading-tight truncate">
                          {spot.name}
                        </p>
                        <p className="text-[11px] text-foreground-2 mt-0.5">
                          {typeLabel(spot.type)}
                          {spot.addedBy?.username &&
                            ` · @${spot.addedBy.username}`}
                        </p>
                        {spot.description && (
                          <p className="text-xs text-foreground-2/70 mt-1 line-clamp-2">
                            {spot.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add spot button */}
          {isLoggedIn && !addMode && (
            <div className="p-4 border-t border-white/8">
              <button
                onClick={() => {
                  setAddMode(true);
                  setSidebarOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent/90 hover:bg-accent text-background font-medium text-sm py-2.5 transition-colors"
              >
                <Plus size={16} />
                Dodaj łowisko
              </button>
            </div>
          )}

          {/* Add form */}
          {addMode && (
            <div className="p-4 border-t border-white/8 bg-background-3/50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">
                  Nowe łowisko
                </p>
                <button
                  onClick={cancelAdd}
                  className="text-foreground-2 hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>

              {!pendingCoords ? (
                <p className="text-xs text-accent animate-pulse">
                  Kliknij na mapie, aby wskazać lokalizację łowiska...
                </p>
              ) : (
                <p className="text-xs text-green-400">
                  Lokalizacja wybrana:{" "}
                  {pendingCoords.lat.toFixed(4)},{" "}
                  {pendingCoords.lng.toFixed(4)}
                </p>
              )}

              <input
                type="text"
                placeholder="Nazwa łowiska *"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                maxLength={100}
                className="w-full rounded-lg border border-white/10 bg-background-2/60 px-3 py-2 text-xs text-foreground placeholder:text-foreground-2/60 focus:border-accent/50 focus:outline-none"
              />

              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-background-2/60 px-3 py-2 text-xs text-foreground focus:border-accent/50 focus:outline-none appearance-none"
              >
                {SPOT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Opis (opcjonalnie)"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                maxLength={300}
                className="w-full rounded-lg border border-white/10 bg-background-2/60 px-3 py-2 text-xs text-foreground placeholder:text-foreground-2/60 focus:border-accent/50 focus:outline-none resize-none"
              />

              {saveError && (
                <p className="text-xs text-red-400">{saveError}</p>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent/90 hover:bg-accent text-background font-medium text-xs py-2.5 transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                Zapisz łowisko
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Map area */}
      <div className="relative flex-1 h-full">
        {addMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-xl border border-accent/30 bg-background-2/90 backdrop-blur-sm px-4 py-2 text-xs text-accent shadow-lg pointer-events-none">
            Kliknij na mapie, aby wybrać lokalizację łowiska
          </div>
        )}
        <MapView
          spots={filteredSpots}
          onMapClick={addMode ? handleMapClick : undefined}
          pendingMarker={pendingCoords}
        />
      </div>
    </div>
  );
}
