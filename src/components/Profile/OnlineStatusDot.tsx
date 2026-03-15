"use client";

interface OnlineStatusDotProps {
  status?: "online" | "offline";
  className?: string;
}

export default function OnlineStatusDot({
  status = "offline",
  className = "",
}: OnlineStatusDotProps) {
  const isOnline = status === "online";
  return (
    <span
      className={
        "block w-4 h-4 rounded-full ring-2 ring-background " +
        (isOnline ? "bg-accent" : "bg-foreground-2/40") +
        (className ? ` ${className}` : "")
      }
      title={isOnline ? "Online" : "Offline"}
    />
  );
}
