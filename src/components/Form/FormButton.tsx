import { type ReactNode } from "react";

import { cn } from "@/utils";

interface FormButtonProps {
  title: string;
  disabled?: boolean;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
}

export default function FormButton({
  title,
  disabled = false,
  fullWidth = true,
  iconLeft,
  iconRight,
  className,
}: FormButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-[10px] text-[12px] font-semibold rounded-lg transition",
        fullWidth ? "w-full" : "w-auto",
        disabled
          ? "bg-background-4 text-foreground-2 cursor-not-allowed"
          : "bg-accent-2 hover:bg-accent text-foreground",
        className
      )}
    >
      {iconLeft}
      <span>{title}</span>
      {iconRight}
    </button>
  );
}
