import { LucideIcon } from "lucide-react";

export type Channel = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  accent: string;
  adminOnly?: boolean;
};
