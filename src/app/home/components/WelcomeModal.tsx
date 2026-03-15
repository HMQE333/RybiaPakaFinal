"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

import { isAppReady, waitForAppReady } from "@/lib/appReady";

const AUTO_CLOSE_SECONDS = 10;
const AUTO_CLOSE_MS = AUTO_CLOSE_SECONDS * 1000;

export default function WelcomeModal() {
  const [appReady, setAppReady] = useState(isAppReady());
  const [isOpen, setIsOpen] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECONDS);
  const didOpenRef = useRef(false);
  const timerActiveRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const previousOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    if (appReady) return;
    let active = true;
    waitForAppReady().then(() => {
      if (active) {
        setAppReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [appReady]);

  useEffect(() => {
    if (!appReady || didOpenRef.current) return;
    didOpenRef.current = true;
    setIsOpen(true);
  }, [appReady]);

  useEffect(() => {
    if (!isOpen || !appReady) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const rafId = window.requestAnimationFrame(() => {
      if (timerActiveRef.current) return;
      timerActiveRef.current = true;
      const startTime = Date.now();
      setSecondsLeft(AUTO_CLOSE_SECONDS);

      const tick = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(
          0,
          Math.ceil((AUTO_CLOSE_MS - elapsed) / 1000)
        );
        setSecondsLeft(remaining);
      };

      intervalRef.current = window.setInterval(tick, 1000);
      tick();

      closeTimerRef.current = window.setTimeout(() => {
        setIsOpen(false);
      }, AUTO_CLOSE_MS);
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(rafId);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      timerActiveRef.current = false;
      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
        previousOverflowRef.current = null;
      }
    };
  }, [appReady, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setProgressKey((value) => value + 1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displaySeconds = Math.max(1, secondsLeft);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/85 px-4 backdrop-blur-md"
      onClick={() => setIsOpen(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Powitanie RybiaPaka.pl"
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-background-4/80 bg-gradient-to-b from-background via-background-2 to-background-2 p-8 text-foreground shadow-[0_30px_70px_rgba(0,0,0,0.5)] modal-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_50%_0%,rgba(0,206,0,0.12),transparent_55%)]" />
        <span className="absolute left-6 top-6 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-accent">
          Alfa
        </span>
        <button
          type="button"
          aria-label="Zamknij"
          onClick={() => setIsOpen(false)}
          className="absolute right-5 top-5 rounded-full border border-background-4/80 bg-background-3/80 p-2 text-foreground transition hover:border-accent hover:text-accent"
        >
          <X size={16} />
        </button>

        <div className="relative flex flex-col items-center gap-5 text-center sm:gap-6">
          <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-background-4/80 bg-background-3/80 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:h-32 sm:w-32">
            <Image
              src="/logo.png"
              alt="RybiaPaka.pl logo"
              fill
              sizes="144px"
              unoptimized
              className="object-cover"
              priority
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              RybiaPaka.pl
            </h2>
            <p className="text-sm text-foreground-2 md:text-base">
              Zintegrowana platforma wędkarska, która łączy galerię zdjęć,
              forum, wiadomości i narzędzia dla wędkarzy w jednym miejscu.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-background-4/80 bg-background-3/70 px-4 py-3 text-xs text-foreground-2 md:text-sm">
            <p>
              To wersja Alfa. Jeśli coś nie działa, prosimy o zgłaszanie błędów
              w{" "}
              <Link
                href="/zglos-problem"
                className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
              >
                formularzu zgłoszeń
              </Link>
              .
            </p>
          </div>

          <div className="w-full space-y-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-4/80">
              <div
                key={progressKey}
                className="h-full w-full origin-left rounded-full bg-gradient-to-r from-accent via-accent to-accent-2"
                style={{
                  animation: `welcome-progress ${AUTO_CLOSE_MS}ms linear forwards`,
                  transform: "scaleX(0)",
                }}
              />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-2">
              Okno zamknie się za{" "}
              <span className="font-semibold text-accent">
                {displaySeconds}
              </span>{" "}
              s
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-accent px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-all duration-300 hover:bg-accent-2 hover:scale-105"
          >
            Przejdź do platformy
          </button>
        </div>
      </div>
    </div>
  );
}
