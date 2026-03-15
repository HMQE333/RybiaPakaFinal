"use client";
import { Flag } from "lucide-react";
import CircleAction from "./CircleAction";

interface ReportButtonProps {
  onClick?: () => void;
}

export default function ReportButton({ onClick }: ReportButtonProps) {
  return (
    <CircleAction
      icon={<Flag size={16} />}
      label="Zgłoś"
      variant="danger"
      onClick={onClick}
    />
  );
}
