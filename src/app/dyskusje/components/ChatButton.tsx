import { cn } from "@/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface ChatButtonProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  accent: string;
}

export default function ChatButton({
  id,
  name,
  description,
  icon,
  gradient,
  accent,
}: ChatButtonProps) {
  const Icon = icon;
  return (
    <Link
      key={id}
      href={`/dyskusje/czat?kanal=${id}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-background-3/80 p-4 text-left transition hover:-translate-y-0.5",
        "border-white/10 hover:border-white/20 shadow-[0_10px_50px_rgba(0,0,0,0.35)] hover:shadow-[0_15px_60px_rgba(0,206,0,0.18)]"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-80",
          gradient
        )}
      />
      <div className="relative flex gap-4 items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-background-4/70 text-foreground">
          <Icon size={22} className={accent} />
        </div>
        <div className="w-full h-full flex items-center justify-between gap-2">
          <p className="font-semibold text-foreground">{name}</p>
          <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-background-4 text-foreground-2">
            #{id}
          </span>
        </div>
      </div>
    </Link>
  );
}
