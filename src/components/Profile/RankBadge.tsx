"use client";
import { BadgeCheck } from "lucide-react";

interface RankBadgeProps {
  rank: string;
}

export default function RankBadge({ rank }: RankBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/30 shadow-sm shadow-accent/20 select-none motion-safe:animate-pulse hover:animate-none hover:shadow-[0_0_18px] hover:shadow-accent/40 hover:-translate-y-[1px] transition-all duration-200"
      title={`Ranga: ${rank}`}
    >
      <BadgeCheck size={16} />
      <span className="text-xs font-semibold tracking-wide">{rank}</span>
    </span>
  );
}
