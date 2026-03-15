"use client";
import { ReactNode } from "react";

type Variant = "success" | "default" | "danger";

interface GenericButtonProps {
  icon: ReactNode;
  label: string;
  expandedOnlyOnHover?: boolean;
  variant?: Variant;
  onClick?: () => void;
  title?: string;
}

export default function GenericButton({
  icon,
  label,
  expandedOnlyOnHover = false,
  variant = "default",
  onClick,
  title,
}: GenericButtonProps) {
  const base =
    "group relative inline-flex items-center h-10 rounded-full select-none transition-all duration-200 focus:outline-none overflow-hidden";

  const styleByVariant: Record<Variant, string> = {
    success:
      "bg-accent text-black font-medium hover:shadow-[0_0_18px] hover:shadow-accent/40 focus:ring-2 focus:ring-accent/60",
    default:
      "bg-background text-foreground-2 border border-background-4/60 hover:text-foreground hover:border-foreground-2/40 focus:ring-2 focus:ring-foreground-2/30",
    danger:
      "bg-background text-foreground-2 border border-background-4/60 hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/5 focus:ring-2 focus:ring-red-500/30",
  };

  const basePadding = expandedOnlyOnHover
    ? "px-3 hover:px-4 focus:px-4"
    : "px-4";

  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      className={`${base} ${styleByVariant[variant]} ${basePadding}`}
    >
      <span className="shrink-0 mr-0.5">{icon}</span>
      <span
        className={
          "whitespace-nowrap text-sm transition-all duration-200 " +
          (expandedOnlyOnHover
            ? "opacity-0 ml-0 max-w-0 group-hover:opacity-100 group-hover:ml-2 group-hover:max-w-[220px] group-focus:opacity-100 group-focus:ml-2 group-focus:max-w-[220px]"
            : "opacity-100 ml-2 max-w-[220px]")
        }
      >
        {label}
      </span>
    </button>
  );
}
