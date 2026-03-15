"use client";
import { ReactNode } from "react";

type Variant = "default" | "danger";

interface CircleActionProps {
  icon: ReactNode;
  label: string;
  variant?: Variant;
  onClick?: () => void;
  title?: string;
}

export default function CircleAction({
  icon,
  label,
  variant = "default",
  onClick,
  title,
}: CircleActionProps) {
  const base =
    "group relative inline-flex items-center h-10 w-10 rounded-full bg-background text-sm text-foreground-2 overflow-visible transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-foreground-2/30 border border-background-4/60";

  const vari =
    variant === "danger"
      ? "hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/5 group-hover:outline group-hover:outline-1 group-hover:outline-red-500/40"
      : "hover:text-foreground hover:border-foreground-2/40";

  return (
    <button
      type="button"
      title={title ?? label}
      aria-label={label}
      onClick={onClick}
      className={`${base} ${vari}`}
    >
      <span className="icon grid place-items-center h-10 w-10 shrink-0">
        {icon}
      </span>
      <span className="label pointer-events-none ml-2 rounded-full bg-background border border-white/10 h-10 px-0 max-w-0 opacity-0 overflow-hidden whitespace-nowrap transition-all duration-200 origin-left group-hover:px-3 group-hover:max-w-[160px] group-hover:opacity-100 group-focus:px-3 group-focus:max-w-[160px] group-focus:opacity-100">
        {label}
      </span>
    </button>
  );
}
