"use client";
import { ReactNode } from "react";

type Variant = "primary" | "danger" | "default";

interface ProfileActionButtonProps {
  icon: ReactNode;
  label: string;
  expanded?: boolean;
  variant?: Variant;
  onClick?: () => void;
  title?: string;
}

export default function ProfileActionButton({
  icon,
  label,
  expanded = false,
  variant = "default",
  onClick,
  title,
}: ProfileActionButtonProps) {
  const base =
    "group inline-flex items-center rounded-full h-10 select-none transition-all duration-200 focus:outline-none";

  const styleByVariant: Record<Variant, string> = {
    primary:
      "bg-accent text-black font-medium hover:shadow-[0_0_18px] hover:shadow-accent/40 focus:ring-2 focus:ring-accent/60",
    default:
      "bg-background text-foreground-2 border border-background-4/60 hover:text-foreground hover:border-foreground-2/40 focus:ring-2 focus:ring-foreground-2/30",
    danger:
      "bg-background text-foreground-2 border border-background-4/60 hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/5 focus:ring-2 focus:ring-red-500/30",
  };

  const padding = expanded ? "px-4" : "px-3 hover:px-4";

  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      className={`${base} ${styleByVariant[variant]} ${padding} overflow-hidden`}
    >
      <span className="shrink-0 mr-0.5">{icon}</span>
      <span
        className={
          "whitespace-nowrap transition-all duration-200 " +
          (expanded
            ? "opacity-100 ml-2 max-w-[220px]"
            : "opacity-0 ml-0 max-w-0 group-hover:opacity-100 group-hover:ml-2 group-hover:max-w-[220px]")
        }
      >
        {label}
      </span>
    </button>
  );
}
