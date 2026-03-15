"use client";

import type { ElementType } from "react";
import { MessageCircle } from "lucide-react";

type ChatHeaderProps = {
  name: string;
  accent: string;
  summary: string;
  Icon?: ElementType;
};

export default function ChatHeader({
  name,
  accent,
  summary,
  Icon,
}: ChatHeaderProps) {
  return (
    <header className="mb-2 border-b border-white/10 px-5 py-5">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-background-4/80 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          {Icon ? (
            <Icon size={28} className={accent} />
          ) : (
            <MessageCircle size={28} className="text-accent" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{name}</h1>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
              Na żywo
            </span>
          </div>

          <p className="text-sm text-foreground-2">{summary}</p>
        </div>
      </div>
    </header>
  );
}
