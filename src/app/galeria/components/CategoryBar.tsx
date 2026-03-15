"use client";

import React from "react";
import {
  Anchor,
  Feather,
  Fish,
  FishSymbol,
  Image as ImageIcon,
  LayoutGrid,
  Sailboat,
  Snowflake,
  Sparkles,
  Target,
  Tent,
} from "lucide-react";

import { cn } from "@/utils";

import type { LucideIcon } from "lucide-react";

interface CategoryBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORY_META: Record<string, { icon: LucideIcon; tagline: string }> = {
  Wszystkie: { icon: LayoutGrid, tagline: "Pełny przekrój galerii" },
  Życiówki: { icon: Sparkles, tagline: "Największe życiówki i rekordy" },
  Krajobraz: { icon: ImageIcon, tagline: "Klimat wody i miejscówek" },
  Spinning: { icon: FishSymbol, tagline: "Drapieżniki i szybkie prowadzenie" },
  Karpiowanie: { icon: Tent, tagline: "Zasiadki i wielkie karpie" },
  Feeder: { icon: Anchor, tagline: "Precyzyjne nęcenie i brania" },
  "Method feeder": { icon: Target, tagline: "Celne podania i pelety" },
  Spławik: { icon: Fish, tagline: "Klasyka spławika i cisza" },
  Muchowe: { icon: Feather, tagline: "Muchy i lekki zestaw" },
  Podlodowe: { icon: Snowflake, tagline: "Lód, przeręble i mormyszka" },
  Morskie: { icon: Sailboat, tagline: "Wyprawy i słona woda" },
  Sumowe: { icon: FishSymbol, tagline: "Sumy i nocne emocje" },
};

const FALLBACK_META = { icon: Fish, tagline: "Nowe ujęcia z łowisk" };

export default function CategoryBar({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryBarProps) {
  return (
    <div className="w-full">
      <div className="custom-scrollbar flex gap-4 overflow-x-auto py-1">
        {categories.map((category) => {
          const meta = CATEGORY_META[category] ?? FALLBACK_META;
          const Icon = meta.icon;
          const isActive = selectedCategory === category;

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              aria-pressed={isActive}
              className={cn(
                "group relative flex min-w-[240px] flex-none items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-200",
                isActive
                  ? "border-accent/50 bg-gradient-to-br from-accent/20 via-white/5 to-transparent shadow-[0_14px_32px_rgba(0,206,0,0.25)]"
                  : "border-white/10 bg-background-2/70 hover:border-accent/40 hover:bg-background-3"
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors",
                  isActive
                    ? "border-accent/40 bg-accent/20 text-accent"
                    : "border-white/10 bg-background-4/80 text-foreground-2 group-hover:text-accent"
                )}
              >
                <Icon size={20} />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {category}
                </span>
                <span className="text-[11px] text-foreground-3">
                  {meta.tagline}
                </span>
              </span>
              <span
                className={cn(
                  "absolute right-3 top-3 h-2.5 w-2.5 rounded-full transition",
                  isActive ? "bg-accent" : "bg-white/10"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
