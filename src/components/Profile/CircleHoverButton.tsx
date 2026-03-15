"use client";
import { ReactNode } from "react";

type Variant = "default" | "danger";

interface CircleHoverButtonProps {
  icon: ReactNode;
  label: string;
  variant?: Variant;
  onClick?: () => void;
  title?: string;
}

export default function CircleHoverButton({
  icon,
  label,
  variant = "default",
  onClick,
  title,
}: CircleHoverButtonProps) {
  const baseBtn =
    "h-10 w-10 rounded-full overflow-hidden inline-flex items-center justify-center transition-all duration-200";

  const styleByVariant: Record<Variant, string> = {
    default:
      "bg-background text-foreground-2 border border-background-4/60 hover:text-foreground hover:border-foreground-2/40",
    danger:
      "bg-background text-foreground-2 border border-background-4/60 hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/5",
  };

  return (
    <div className={`group w-[160px] flex`}>
      <button
        type="button"
        aria-label={label}
        title={title ?? label}
        onClick={onClick}
        className={`${baseBtn} ${styleByVariant[variant]} group-hover:w-[160px] group-focus:w-[160px] group-hover:justify-start group-focus:justify-start group-hover:pl-3 group-focus:pl-3 group-hover:pr-4 group-focus:pr-4`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="whitespace-nowrap text-sm opacity-0 w-0 ml-0 transition-all duration-200 group-hover:opacity-100 group-hover:ml-2 group-focus:opacity-100 group-focus:ml-2 group-hover:max-w-[120px] group-focus:max-w-[120px] truncate">
          {label}
        </span>
      </button>
    </div>
  );
}
