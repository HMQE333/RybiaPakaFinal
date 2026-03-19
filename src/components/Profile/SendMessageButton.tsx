"use client";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import CircleAction from "./CircleAction";

interface SendMessageButtonProps {
  targetId?: number;
  onClick?: () => void;
}

export default function SendMessageButton({ targetId, onClick }: SendMessageButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (targetId) {
      router.push(`/wiadomosci/${targetId}`);
    }
    onClick?.();
  }

  return (
    <CircleAction
      icon={<MessageSquare size={16} />}
      label="Wyślij wiadomość"
      variant="default"
      onClick={handleClick}
    />
  );
}
