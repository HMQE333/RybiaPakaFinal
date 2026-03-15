import type { ComponentType } from "react";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

export type SearchablePage = {
  href: string;
  title: string;
  keywords: string[];
};
