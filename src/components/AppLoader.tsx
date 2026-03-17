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

const INITIAL_LOADER_TIMEOUT_MS = 5000;
const MIN_VISIBLE_MS = 1000;
const FADE_OUT_MS = 1500;
const FONT_READY_TIMEOUT_MS = 3000;
const IMAGE_READY_TIMEOUT_MS = 5000;
const CRITICAL_IMAGE_SELECTOR =
  "img[data-critical-logo], img[data-critical-image]";

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
    if (!src) { resolve(); return; }
    if (img.complete && img.naturalWidth > 0) { resolve(); return; }
    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      img.removeEventListener("load", onDone);
      img.removeEventListener("error", onDone);
    };
    const onDone = () => { window.clearTimeout(timer); cleanup(); resolve(); };
    const timer = window.setTimeout(() => { cleanup(); resolve(); }, timeoutMs);
    img.addEventListener("load", onDone, { once: true });
    img.addEventListener("error", onDone, { once: true });
    if (img.decode) {
      img.decode().catch(() => undefined).finally(() => {
        window.clearTimeout(timer); onDone();
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
    setFactIndex(Math.floor(Math.random() * FACTS.length));
  }, []);

  useEffect(() => {
    let active = true;
    const startedAt = performance.now();

    const finish = () => {
      if (!active || settledRef.current) return;
      settledRef.current = true;
      markAppReady();
      setExiting(true);
      hideTimerRef.current = window.setTimeout(
        () => setVisible(false),
        FADE_OUT_MS
      );
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

    timeoutRef.current = window.setTimeout(finish, INITIAL_LOADER_TIMEOUT_MS);

    readyPromise.then(async () => {
      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_VISIBLE_MS) await wait(MIN_VISIBLE_MS - elapsed);
      await doubleFrame();
      finish();
    });

    return () => {
      active = false;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("app-loading");
    return () => document.body.classList.remove("app-loading");
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes al-bob {
          0%   { transform: translateY(0px); }
          30%  { transform: translateY(-11px); }
          55%  { transform: translateY(-3px); }
          75%  { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes al-sink {
          0%   { transform: translateY(0px); }
          20%  { transform: translateY(4px); }
          55%  { transform: translateY(20px); }
          80%  { transform: translateY(44px); }
          100% { transform: translateY(44px); }
        }
        @keyframes al-overlay-fade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes al-fact-out {
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(10px); }
        }

        .al-bob  { animation: al-bob 2.6s cubic-bezier(0.37, 0, 0.63, 1) infinite; }
        .al-sink { animation: al-sink 0.85s cubic-bezier(0.4, 0, 0.55, 1) forwards; }
        .al-overlay-fade {
          animation: al-overlay-fade 0.65s ease-in forwards;
          animation-delay: 0.8s;
        }
        .al-fact-out {
          animation: al-fact-out 0.3s ease-in forwards;
        }
      `}</style>

      <div
        className={`app-loader fixed inset-0 z-[100] flex items-center justify-center bg-background ${
          exiting ? "al-overlay-fade" : ""
        }`}
      >
        <div className="flex flex-col items-center gap-5 select-none">

          {/* Single SVG: water (static) + bobber group (animated) — always perfectly centred */}
          <svg
            width="160"
            height="88"
            viewBox="0 0 160 88"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: "visible" }}
          >
            {/* Bobber group — bottom layer, animates up/down */}
            <g
              className={exiting ? "al-sink" : "al-bob"}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              filter="url(#al-glow)"
            >
              {/* Antenna */}
              <line x1="80" y1="6" x2="80" y2="27" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />

              {/* Body — green top fill (clipped above equator y=45) */}
              <ellipse cx="80" cy="45" rx="11" ry="17" fill="rgba(34,197,94,0.2)" clipPath="url(#al-top)" />
              {/* Body — outline */}
              <ellipse cx="80" cy="45" rx="11" ry="17" fill="none" stroke="#22c55e" strokeWidth="1.4" />

              {/* Equator line */}
              <line x1="69.3" y1="45" x2="90.7" y2="45" stroke="#22c55e" strokeWidth="0.8" strokeOpacity="0.45" />

              {/* Bottom pin */}
              <line x1="80" y1="62" x2="80" y2="75" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="80" cy="77" r="2" fill="#6b7280" />
            </g>

            {/* Water mask — solid bg rect hides the bobber as it sinks below y=44 */}
            <rect x="-20" y="44" width="200" height="60" fill="var(--background)" />

            {/* Water waves — drawn on top of mask, always visible */}
            <path
              d="M2,45 C22,41 42,49 62,45 C82,41 102,49 122,45 C142,41 158,49 158,45"
              stroke="rgba(74,222,128,0.55)"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M8,49 C28,45 48,53 68,49 C88,45 108,53 128,49 C148,45 156,52 158,49"
              stroke="rgba(74,222,128,0.22)"
              strokeWidth="0.8"
              fill="none"
              strokeLinecap="round"
            />

            <defs>
              <clipPath id="al-top">
                <rect x="0" y="0" width="160" height="45" />
              </clipPath>
              <filter id="al-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(34,197,94,0.55)" />
              </filter>
            </defs>
          </svg>

          <p
            className={`text-[11px] text-foreground-2 text-center max-w-[260px] leading-relaxed ${
              exiting ? "al-fact-out" : ""
            }`}
          >
            {FACTS[factIndex]}
          </p>
        </div>
      </div>
    </>
  );
}
