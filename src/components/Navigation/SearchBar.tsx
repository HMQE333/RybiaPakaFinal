import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LucideSearch } from "lucide-react";

import { cn } from "@/utils";
import Logo from "@/components/Logo";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(false);
  const [status, setStatus] = useState<"none" | "current" | "missing">("none");
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => setHighlight(false), 700);
    return () => {
      clearTimeout(t);
    };
  }, [highlight]);

  useEffect(() => {
    if (status === "none") return;
    const t = setTimeout(() => setStatus("none"), 1800);
    return () => clearTimeout(t);
  }, [status]);

  const runSearch = () => {
    const term = query.trim();
    if (!term) return;
    const normalizedPathname = pathname ? decodeURI(pathname) : "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const navigateTo = (targetHref: string) => {
      const normalizedTarget = targetHref.startsWith("/")
        ? targetHref
        : `/${targetHref}`;
      setHighlight(true);
      if (normalizedPathname && normalizedPathname === normalizedTarget) {
        setStatus("current");
        return;
      }
      router.push(normalizedTarget);
    };

    if (origin && term.startsWith(origin)) {
      const nextHref = term.slice(origin.length) || "/";
      navigateTo(nextHref);
      return;
    }

    if (/^https?:\/\//i.test(term)) {
      try {
        const url = new URL(term);
        if (origin && url.origin === origin) {
          navigateTo(`${url.pathname}${url.search}${url.hash}`);
          return;
        }
      } catch {
        // ignore invalid URL
      }
    }

    if (term.startsWith("/")) {
      navigateTo(term);
      return;
    }

    if (/^administracja(\/|$)/i.test(term)) {
      navigateTo(`/${term}`);
      return;
    }
    setHighlight(true);
    const params = new URLSearchParams();
    params.set("q", term);
    router.push(`/szukaj?${params.toString()}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex w-full min-w-0 items-center gap-[10px] px-4 py-2 text-foreground-2 border border-background-4 rounded-lg bg-background-3/10 transition-colors",
          "hover:text-accent focus-within:text-accent",
          highlight && "border-accent/70 shadow-[0_0_0_1px_rgba(0,206,0,0.35)]"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <LucideSearch
          size={16}
          className={cn(
            "transition-colors",
            highlight ? "text-accent" : "text-foreground-2"
          )}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Szukaj..."
          ref={inputRef}
          className={cn(
            "w-full min-w-0 bg-transparent border-none outline-none text-[12px] placeholder:text-foreground-2",
            highlight ? "text-accent" : "text-foreground"
          )}
        />
      </div>

      {status !== "none" && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center pt-16 pointer-events-none">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-background/95 px-5 py-4 shadow-xl shadow-black/30 text-sm text-foreground flex items-center gap-3 modal-pop">
            <Logo size={38} />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                {status === "current"
                  ? "Jesteś na stronie zawierającej tę frazę"
                  : "Nie znaleziono takiej frazy"}
              </p>
              <p className="text-foreground-2 text-xs">
                {status === "current"
                  ? "Fraza pasuje do bieżącej podstrony Zintegrowanej Platformy RybiejPaki."
                  : "Przeszukaliśmy Zintegrowaną Platformę RybiejPaki, spróbuj innego słowa."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

