"use client";
import { ReactNode } from "react";

type Variant = "default" | "danger";

interface HoverActionIconProps {
  icon: ReactNode;
  label: string;
  variant?: Variant;
  onClick?: () => void;
  title?: string;
}

export default function HoverActionIcon({
  icon,
  label,
  variant = "default",
  onClick,
  title,
}: HoverActionIconProps) {
  const base =
    "group relative inline-flex items-center justify-center h-10 rounded-full select-none transition-all duration-200 overflow-hidden w-auto max-w-10 pl-0 pr-0 focus:max-w-[240px] focus:pl-3 focus:pr-4";

  const styleByVariant: Record<Variant, string> = {
    default:
      "bg-background text-foreground-2 border border-background-4/60 hover:text-foreground hover:border-foreground-2/40",
    danger:
      "bg-background text-foreground-2 border border-background-4/60 hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/5",
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      onClick={onClick}
      className={`${base} ${styleByVariant[variant]} hover:max-w-[240px] hover:pl-3 hover:pr-4`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="whitespace-nowrap text-sm opacity-0 w-0 ml-0 transition-all duration-200 group-hover:opacity-100 group-hover:w-auto group-hover:ml-2 group-focus:opacity-100 group-focus:w-auto group-focus:ml-2">
        {label}
      </span>
    </button>
  );
}
