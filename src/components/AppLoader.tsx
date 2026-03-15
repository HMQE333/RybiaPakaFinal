"use client";

import { useEffect, useRef, useState } from "react";

import { markAppReady, waitForAppReadyTasks } from "@/lib/appReady";

const FACTS = [
  "Ciekawostka: Czy wiedziałeś, że ryby mają linię boczną, która wyczuwa drgania wody?",
  "Ciekawostka: Czy wiedziałeś, że szczupak potrafi przyspieszyć w ułamku sekundy, by zaatakować ofiarę?",
  "Ciekawostka: Czy wiedziałeś, że karpie mogą dożywać kilkudziesięciu lat?",
  "Ciekawostka: Czy wiedziałeś, że sum ma bardzo czułe wąsy pomagające mu znaleźć pokarm w mętnej wodzie?",
  "Ciekawostka: Czy wiedziałeś, że ryby reagują na dźwięki i wibracje?",
  "Ciekawostka: Czy wiedziałeś, że wiele ryb żeruje najaktywniej o świcie i zmierzchu?",
  "Ciekawostka: Czy wiedziałeś, że okonie często polują w stadach, zbijając narybek?",
  "Ciekawostka: Czy wiedziałeś, że pstrągi preferują chłodne, dobrze natlenione wody?",
  "Ciekawostka: Czy wiedziałeś, że leszcze chętnie żerują na miękkim dnie?",
  "Ciekawostka: Czy wiedziałeś, że ryby mają bardzo dobrze rozwinięty węch?",
];
const INITIAL_LOADER_TIMEOUT_MS = 12000;
const MIN_VISIBLE_MS = 220;
const FADE_OUT_MS = 220;
const FONT_READY_TIMEOUT_MS = 3000;
const IMAGE_READY_TIMEOUT_MS = 12000;
const CRITICAL_IMAGE_SELECTOR = "img[data-critical-logo], img[data-critical-image]";

const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const nextFrame = () =>
  new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

const doubleFrame = async () => {
  await nextFrame();
  await nextFrame();
};

const waitForImageElement = (img: HTMLImageElement, timeoutMs: number) =>
  new Promise<void>((resolve) => {
    const src = img.currentSrc || img.getAttribute("src") || "";
    if (!src) {
      resolve();
      return;
    }

    if (img.complete && img.naturalWidth > 0) {
      resolve();
      return;
    }

    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      img.removeEventListener("load", onDone);
      img.removeEventListener("error", onDone);
    };
    const onDone = () => {
      window.clearTimeout(timer);
      cleanup();
      resolve();
    };

    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, timeoutMs);

    img.addEventListener("load", onDone, { once: true });
    img.addEventListener("error", onDone, { once: true });

    if (img.decode) {
      img
        .decode()
        .catch(() => undefined)
        .finally(() => {
          window.clearTimeout(timer);
          onDone();
        });
    }
  });

const waitForCriticalImages = async () => {
  const nodes = Array.from(
    document.querySelectorAll<HTMLImageElement>(CRITICAL_IMAGE_SELECTOR)
  );
  if (nodes.length === 0) return;
  await Promise.all(
    nodes.map((img) => waitForImageElement(img, IMAGE_READY_TIMEOUT_MS))
  );
};

export default function AppLoader() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const settledRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * FACTS.length);
    setFactIndex(randomIndex);
  }, []);

  useEffect(() => {
    let active = true;
    const startedAt = performance.now();

    const finish = (reason: "ready" | "timeout") => {
      if (!active || settledRef.current) return;
      settledRef.current = true;
      if (reason === "ready" && process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.info(
          `[AppLoader] Ready after ${Math.round(performance.now() - startedAt)}ms.`
        );
      }
      if (reason === "timeout" && process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(
          "[AppLoader] Initial load timed out; showing UI without all assets."
        );
      }
      markAppReady();
      setExiting(true);
      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
      }, FADE_OUT_MS);
    };

    const fontReady =
      "fonts" in document && document.fonts?.ready
        ? Promise.race([
            document.fonts.ready.catch(() => undefined),
            wait(FONT_READY_TIMEOUT_MS),
          ])
        : Promise.resolve();

    const afterPaint = doubleFrame();
    const criticalImagesReady = afterPaint.then(() => waitForCriticalImages());

    const readyPromise = Promise.allSettled([
      fontReady,
      criticalImagesReady,
      waitForAppReadyTasks(),
    ]);

    timeoutRef.current = window.setTimeout(() => {
      finish("timeout");
    }, INITIAL_LOADER_TIMEOUT_MS);

    readyPromise.then(async () => {
      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_VISIBLE_MS) {
        await wait(MIN_VISIBLE_MS - elapsed);
      }
      await doubleFrame();
      finish("ready");
    });

    return () => {
      active = false;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("app-loading");
    return () => {
      document.body.classList.remove("app-loading");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`app-loader fixed inset-0 z-[100] flex items-center justify-center bg-background ${
        exiting ? "app-loader--exit" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 rounded-full border-4 border-accent/30 border-t-accent shadow-[0_0_20px_rgba(0,206,0,0.25)] motion-safe:animate-spin" />
        <span className="text-xs uppercase tracking-[0.35em] text-foreground-2">
          ŁADOWANIE...
        </span>
        <p className="text-[11px] text-foreground-2 text-center max-w-xs">
          {FACTS[factIndex]}
        </p>
      </div>
    </div>
  );
}
