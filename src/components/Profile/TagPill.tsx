"use client";

interface TagPillProps {
  label: string;
}

export default function TagPill({ label }: TagPillProps) {
  return (
    <span className="px-3 py-1 rounded-full bg-background-2/80 text-foreground-2 text-sm border border-white/10 hover:border-accent/50 hover:text-accent hover:bg-accent/10 transition-colors duration-200">
      {label}
    </span>
  );
}
