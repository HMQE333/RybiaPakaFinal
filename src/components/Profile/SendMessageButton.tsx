"use client";
import { MessageSquare } from "lucide-react";
import CircleAction from "./CircleAction";

interface SendMessageButtonProps {
  onClick?: () => void;
}

export default function SendMessageButton({ onClick }: SendMessageButtonProps) {
  return (
    <CircleAction
      icon={<MessageSquare size={16} />}
      label="Wyślij wiadomość"
      variant="default"
      onClick={onClick}
    />
  );
}
