"use client";

import { useState } from "react";
import {
  X,
  Star,
  MapPin,
  Fish,
  MessageSquare,
  Lightbulb,
  Camera,
  Bookmark,
  Plus,
  ChevronLeft,
  Clock,
  Users,
  Trophy,
} from "lucide-react";
import { cn } from "@/utils";
import type { MockSpot } from "./mockData";
import { TYPE_CONFIG } from "./mockData";

type Tab = "opis" | "zdjecia" | "opinie" | "wskazowki" | "ryby";

function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            "transition-colors",
            i <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-white/20"
          )}
        />
      ))}
    </span>
  );
}

function imgUrl(seed: string, w = 600, h = 380) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

function avatarUrl(seed: string) {
  return `https://picsum.photos/seed/av-${seed}/64/64`;
}

type Props = {
  spot: MockSpot;
  onClose: () => void;
};

export default function SpotDetailPanel({ spot, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("opis");
  const [saved, setSaved] = useState(false);
  const cfg = TYPE_CONFIG[spot.type];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "opis", label: "Opis", icon: <MapPin size={13} /> },
    { id: "zdjecia", label: "Zdjęcia", icon: <Camera size={13} /> },
    { id: "opinie", label: `Opinie (${spot.reviewCount})`, icon: <MessageSquare size={13} /> },
    { id: "wskazowki", label: "Wskazówki", icon: <Lightbulb size={13} /> },
    { id: "ryby", label: "Ryby", icon: <Fish size={13} /> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Cover image */}
      <div className="relative h-44 shrink-0 overflow-hidden">
        <img
          src={imgUrl(spot.coverSeed, 700, 300)}
          alt={spot.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background-2 via-background-2/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background-2/30 to-transparent" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition hover:bg-black/80 hover:text-white"
        >
          <X size={15} />
        </button>

        {/* Type badge */}
        <div
          className="absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm border"
          style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}
        >
          {cfg.label}
        </div>
      </div>

      {/* Header info */}
      <div className="px-5 pt-3 pb-0 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {spot.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-foreground-2">
              <MapPin size={11} className="shrink-0" />
              <span>{spot.voivodeship}</span>
              <span className="opacity-40">·</span>
              <Clock size={11} className="shrink-0" />
              <span>{spot.lastActivity}</span>
            </div>
          </div>

          <button
            onClick={() => setSaved((v) => !v)}
            className={cn(
              "shrink-0 flex h-9 w-9 items-center justify-center rounded-full border transition-all",
              saved
                ? "border-accent/50 bg-accent/15 text-accent"
                : "border-white/10 bg-white/5 text-foreground-2 hover:border-white/20 hover:text-foreground"
            )}
            title={saved ? "Usuń z ulubionych" : "Zapisz do ulubionych"}
          >
            <Bookmark size={15} className={saved ? "fill-accent" : ""} />
          </button>
        </div>

        {/* Rating row */}
        <div className="flex items-center gap-3 mt-2">
          <StarRating value={spot.rating} size={13} />
          <span className="text-sm font-semibold text-amber-400">{spot.rating.toFixed(1)}</span>
          <span className="text-xs text-foreground-2">({spot.reviewCount} opinii)</span>
        </div>

        {/* Fish species pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {spot.fishSpecies.map((f) => (
            <span
              key={f}
              className="flex items-center gap-1 rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[11px] text-foreground-2 capitalize"
            >
              <Fish size={10} className="text-accent" />
              {f}
            </span>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          {[
            { label: "Opinię", icon: <Star size={12} /> },
            { label: "Wskazówkę", icon: <Lightbulb size={12} /> },
            { label: "Zdjęcie", icon: <Camera size={12} /> },
            { label: "Rybę", icon: <Fish size={12} /> },
          ].map((btn) => (
            <button
              key={btn.label}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-white/10 bg-background-3/60 px-3 py-1.5 text-xs text-foreground-2 hover:border-accent/30 hover:bg-accent/8 hover:text-accent transition-colors"
            >
              <Plus size={11} />
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-3 border-t border-white/8 shrink-0">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium transition-colors border-b-2 whitespace-nowrap",
                tab === t.id
                  ? "border-accent text-accent"
                  : "border-transparent text-foreground-2 hover:text-foreground"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* OPIs */}
        {tab === "opis" && (
          <div className="px-5 py-4 space-y-4">
            <p className="text-sm text-foreground-2 leading-relaxed">{spot.description}</p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Opinie", value: spot.reviewCount, icon: <Users size={14} className="text-accent" /> },
                { label: "Gatunki ryb", value: spot.fishSpecies.length, icon: <Fish size={14} className="text-accent" /> },
                { label: "Wskazówki", value: spot.tips.length, icon: <Lightbulb size={14} className="text-accent" /> },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1 rounded-xl border border-white/8 bg-background-3/40 py-3"
                >
                  {stat.icon}
                  <span className="text-base font-bold text-foreground">{stat.value}</span>
                  <span className="text-[10px] text-foreground-2">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Last reviews preview */}
            <div>
              <p className="text-xs font-semibold text-foreground-2 uppercase tracking-wider mb-2">
                Ostatnie opinie
              </p>
              <div className="space-y-2">
                {spot.reviews.slice(0, 2).map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-white/8 bg-background-3/30 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={avatarUrl(r.avatarSeed)}
                        alt={r.author}
                        className="h-6 w-6 rounded-full object-cover border border-white/10"
                      />
                      <span className="text-xs font-medium text-foreground">{r.author}</span>
                      <StarRating value={r.rating} size={10} />
                    </div>
                    <p className="text-xs text-foreground-2 line-clamp-2">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ZDJĘCIA */}
        {tab === "zdjecia" && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {spot.photos.map((photo) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-background-3">
                  <img
                    src={imgUrl(photo.seed, 400, 300)}
                    alt={photo.caption ?? "Zdjęcie łowiska"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {photo.caption && (
                    <p className="absolute bottom-2 left-2 right-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 leading-tight">
                      {photo.caption}
                    </p>
                  )}
                  <p className="absolute top-2 left-2 text-[10px] text-white/70 bg-black/40 rounded px-1.5 py-0.5 backdrop-blur-sm">
                    @{photo.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OPINIE */}
        {tab === "opinie" && (
          <div className="px-4 py-4 space-y-3">
            {/* Average rating */}
            <div className="rounded-2xl border border-white/8 bg-background-3/30 p-4 flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-amber-400">{spot.rating.toFixed(1)}</p>
                <StarRating value={spot.rating} size={14} />
                <p className="text-[10px] text-foreground-2 mt-0.5">{spot.reviewCount} opinii</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const pct = stars === 5 ? 60 : stars === 4 ? 25 : stars === 3 ? 10 : 5;
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-[10px] text-foreground-2 w-2">{stars}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {spot.reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/8 bg-background-3/30 p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <img
                    src={avatarUrl(r.avatarSeed)}
                    alt={r.author}
                    className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">{r.author}</span>
                      <span className="text-[10px] text-foreground-2 shrink-0">{r.date}</span>
                    </div>
                    <StarRating value={r.rating} size={11} />
                  </div>
                </div>
                <p className="text-xs text-foreground-2 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* WSKAZÓWKI */}
        {tab === "wskazowki" && (
          <div className="px-4 py-4 space-y-2.5">
            {spot.tips.map((tip) => (
              <div
                key={tip.id}
                className="rounded-xl border border-white/8 bg-background-3/30 p-3.5 flex gap-3"
              >
                <span className="text-xl shrink-0 mt-0.5">{tip.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground leading-relaxed">{tip.text}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-foreground-2">@{tip.author}</span>
                    <span className="text-foreground-2 opacity-30">·</span>
                    <span className="text-[10px] text-foreground-2">{tip.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RYBY */}
        {tab === "ryby" && (
          <div className="px-4 py-4 space-y-3">
            <p className="text-[11px] text-foreground-2 uppercase tracking-wider font-semibold mb-1">
              Gatunki zgłoszone przez wędkarzy
            </p>
            {spot.fishEntries.map((fe) => (
              <div
                key={fe.id}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-background-3/30 p-3 hover:border-white/15 transition-colors"
              >
                <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-background-4">
                  <img
                    src={imgUrl(fe.photoSeed, 100, 100)}
                    alt={fe.species}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground capitalize">{fe.species}</p>
                  <p className="text-xs text-foreground-2">@{fe.author}</p>
                  {fe.weight && (
                    <p className="flex items-center gap-1 text-xs text-accent mt-0.5">
                      <Trophy size={10} />
                      {fe.weight}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">{fe.count}</p>
                  <p className="text-[10px] text-foreground-2">zgłoszeń</p>
                  <p className="text-[10px] text-foreground-2/60 mt-0.5">{fe.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
