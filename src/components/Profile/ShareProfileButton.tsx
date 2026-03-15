"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
import CircleAction from "./CircleAction";

interface ShareProfileButtonProps {
  username: string;
}

export default function ShareProfileButton({
  username,
}: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const url = `${window.location.origin}/profil/${encodeURIComponent(username)}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <div className="relative">
      <CircleAction
        icon={<Share2 size={16} />}
        label="Udostępnij"
        variant="default"
        onClick={copy}
      />
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded bg-background-4 text-foreground shadow">
          Skopiowano!
        </span>
      )}
    </div>
  );
}
