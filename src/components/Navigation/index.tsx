"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Megaphone, MessageSquare, Images, Menu } from "lucide-react";

import { cn } from "@/utils";
import SearchBar from "./SearchBar";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Strona Główna", href: "/", icon: Home },
  { label: "Dyskusje", href: "/dyskusje", icon: Megaphone },
  { label: "Forum", href: "/forum", icon: MessageSquare },
  { label: "Galeria", href: "/galeria", icon: Images },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (!pathname) return false;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="w-full bg-background/95 border-b border-background-3">
      <nav className="relative h-[70px] flex items-center gap-3 px-4 lg:px-0 lg:justify-between">
        <div className="flex items-center gap-3 lg:gap-[22px] lg:pl-[30px]">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label="Menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-background-4 text-foreground-2 transition-colors hover:text-accent sm:hidden"
          >
            <Menu size={18} />
          </button>
          <div className="hidden sm:flex items-center gap-2 lg:gap-[22px]">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors",
                    "text-foreground-2 hover:text-accent",
                    active && "text-accent"
                  )}
                >
                  <Icon
                    size={16}
                    className={cn(
                      "transition-colors",
                      active
                        ? "text-accent"
                        : "text-foreground-2 group-hover:text-accent"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0 sm:flex-none sm:pr-[30px]">
          <SearchBar />
        </div>
      </nav>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="sm:hidden border-t border-background-3 bg-background/95"
        >
          <div className="flex flex-col gap-1 px-4 py-3">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                    active
                      ? "bg-background-3 text-accent"
                      : "text-foreground-2 hover:text-accent hover:bg-background-3/60"
                  )}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
