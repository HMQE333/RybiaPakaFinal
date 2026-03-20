"use client";

import React, { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { PLATFORM_EMOJIS } from "@/lib/forumEmojis";

type ReactionCounts = Record<string, number>;

interface ForumReactionBarProps {
  threadId: number;
  initialCounts?: ReactionCounts;
  initialMine?: string[];
  authenticated?: boolean;
}

export default function ForumReactionBar({
  threadId,
  initialCounts = {},
  initialMine = [],
  authenticated = false,
}: ForumReactionBarProps) {
  const [counts, setCounts] = useState<ReactionCounts>(initialCounts);
  const [mine, setMine] = useState<string[]>(initialMine);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (!pickerOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [pickerOpen]);

  async function toggleReaction(emojiId: string) {
    if (!authenticated || loading) return;
    setLoading(emojiId);

    const isCurrentlyReacted = mine.includes(emojiId);

    setCounts((prev) => ({
      ...prev,
      [emojiId]: Math.max(0, (prev[emojiId] ?? 0) + (isCurrentlyReacted ? -1 : 1)),
    }));
    setMine((prev) =>
      isCurrentlyReacted ? prev.filter((id) => id !== emojiId) : [...prev, emojiId]
    );

    try {
      const res = await fetch(`/api/forum/threads/${threadId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji: emojiId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts ?? {});
        setMine(data.mine ?? []);
      } else {
        setCounts((prev) => ({
          ...prev,
          [emojiId]: Math.max(0, (prev[emojiId] ?? 0) + (isCurrentlyReacted ? 1 : -1)),
        }));
        setMine((prev) =>
          isCurrentlyReacted ? [...prev, emojiId] : prev.filter((id) => id !== emojiId)
        );
      }
    } catch {
      setCounts((prev) => ({
        ...prev,
        [emojiId]: Math.max(0, (prev[emojiId] ?? 0) + (isCurrentlyReacted ? 1 : -1)),
      }));
      setMine((prev) =>
        isCurrentlyReacted ? [...prev, emojiId] : prev.filter((id) => id !== emojiId)
      );
    } finally {
      setLoading(null);
    }
  }

  const activeEmojis = PLATFORM_EMOJIS.filter((e) => (counts[e.id] ?? 0) > 0);

  return (
    <div className="relative flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
      {activeEmojis.map((emoji) => {
        const count = counts[emoji.id] ?? 0;
        const ismine = mine.includes(emoji.id);
        return (
          <button
            key={emoji.id}
            onClick={() => toggleReaction(emoji.id)}
            disabled={!authenticated || loading === emoji.id}
            title={emoji.title}
            className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold transition-all select-none ${
              ismine
                ? "border-accent/60 bg-accent/15 text-accent shadow-[0_0_8px_rgba(0,206,0,0.2)]"
                : "border-white/10 bg-white/5 text-foreground-2 hover:border-white/20 hover:bg-white/10"
            } ${loading === emoji.id ? "opacity-60" : ""} ${!authenticated ? "cursor-default" : "cursor-pointer"}`}
          >
            <img
              src={emoji.src}
              alt={emoji.label}
              className={`w-4 h-4 ${loading === emoji.id ? "animate-bounce" : ""}`}
              draggable={false}
            />
            <span>{count}</span>
          </button>
        );
      })}

      {authenticated && (
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setPickerOpen((v) => !v)}
            title="Dodaj reakcję"
            className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs transition-all select-none ${
              pickerOpen
                ? "border-accent/60 bg-accent/15 text-accent"
                : totalReactions === 0
                  ? "border-dashed border-white/20 text-foreground-2/60 hover:border-white/30 hover:text-foreground-2"
                  : "border-white/10 text-foreground-2/60 hover:border-white/20 hover:text-foreground-2"
            }`}
          >
            <Smile size={14} />
            {totalReactions === 0 && <span className="hidden sm:inline">Reaguj</span>}
          </button>

          {pickerOpen && (
            <div
              ref={pickerRef}
              className="absolute bottom-full left-0 mb-2 z-40 flex gap-1.5 p-2 rounded-2xl border border-white/15 bg-background-2 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm"
              style={{ minWidth: "max-content" }}
            >
              {PLATFORM_EMOJIS.map((emoji) => {
                const ismine = mine.includes(emoji.id);
                return (
                  <button
                    key={emoji.id}
                    onClick={() => {
                      toggleReaction(emoji.id);
                      setPickerOpen(false);
                    }}
                    title={emoji.title}
                    className={`group relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                      ismine
                        ? "border-accent/50 bg-accent/15"
                        : "border-transparent hover:border-white/15 hover:bg-white/8"
                    }`}
                  >
                    <img
                      src={emoji.src}
                      alt={emoji.label}
                      className="w-8 h-8 transition-transform group-hover:scale-125"
                      draggable={false}
                    />
                    <span className="text-[10px] text-foreground-2 whitespace-nowrap leading-none">
                      {emoji.label}
                    </span>
                    {ismine && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
