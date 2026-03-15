"use client";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="group rounded-2xl bg-background-2/70 p-4 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-[1px] hover:border-white/20">
      <div className="flex items-center justify-between text-foreground-2 text-sm">
        <span>{label}</span>
        {icon && <span className="text-accent/80">{icon}</span>}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-2 h-[3px] rounded bg-white/10 overflow-hidden">
        <div className="h-full w-0 group-hover:w-full bg-accent/70 transition-all duration-500" />
      </div>
    </div>
  );
}
