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
const FADE_OUT_MS = 1600;
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
          30%  { transform: translateY(-13px); }
          55%  { transform: translateY(-4px); }
          75%  { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes al-wave {
          0%, 100% { d: path("M0,6 C16,0 34,12 50,6 C66,0 84,12 100,6 C116,0 134,12 150,6"); }
          50%       { d: path("M0,6 C16,12 34,0 50,6 C66,12 84,0 100,6 C116,12 134,0 150,6"); }
        }
        @keyframes al-sink {
          0%   { transform: translateY(0px) scaleY(1);    opacity: 1; }
          18%  { transform: translateY(8px) scaleY(0.97); opacity: 1; }
          42%  { transform: translateY(80px) scaleY(0.9); opacity: 0.9; }
          58%  { transform: translateY(55px) scaleY(0.95); opacity: 0.8; }
          80%  { transform: translateY(130px) scaleY(0.8); opacity: 0.4; }
          100% { transform: translateY(160px) scaleY(0.6); opacity: 0; }
        }
        @keyframes al-overlay-fade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes al-fact-out {
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(10px); }
        }

        .al-bob      { animation: al-bob 2.6s cubic-bezier(0.37, 0, 0.63, 1) infinite; }
        .al-sink     { animation: al-sink 1s cubic-bezier(0.4, 0, 0.8, 0.6) forwards; }
        .al-overlay-fade {
          animation: al-overlay-fade 0.55s ease-in forwards;
          animation-delay: 1.05s;
        }
        .al-fact-out {
          animation: al-fact-out 0.35s ease-in forwards;
        }
        .al-wave path {
          animation: al-wave 2.4s ease-in-out infinite;
        }
      `}</style>

      <div
        className={`app-loader fixed inset-0 z-[100] flex items-center justify-center bg-background ${
          exiting ? "al-overlay-fade" : ""
        }`}
      >
        <div className="flex flex-col items-center gap-6 select-none">
          <div className="relative flex flex-col items-center" style={{ width: 120, height: 100 }}>

            {/* Bobber */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 ${exiting ? "al-sink" : "al-bob"}`}
              style={{ top: 22, transformOrigin: "center center" }}
            >
              <svg
                width="20"
                height="64"
                viewBox="0 0 20 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: "drop-shadow(0 0 8px rgba(34,197,94,0.55))" }}
              >
                {/* Top antenna */}
                <line x1="10" y1="0" x2="10" y2="12" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />

                {/* Body outline */}
                <ellipse cx="10" cy="28" rx="9" ry="15" fill="none" stroke="#22c55e" strokeWidth="1.5" />

                {/* Green fill – top half */}
                <ellipse cx="10" cy="28" rx="9" ry="15" fill="rgba(34,197,94,0.18)" clipPath="url(#al-top)" />

                {/* Equator divider */}
                <line x1="1.2" y1="28" x2="18.8" y2="28" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.6" />

                {/* Bottom hook pin */}
                <line x1="10" y1="43" x2="10" y2="56" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="57" r="1.8" fill="#6b7280" />

                <defs>
                  <clipPath id="al-top">
                    <rect x="0" y="0" width="20" height="28" />
                  </clipPath>
                </defs>
              </svg>
            </div>

            {/* Water surface */}
            <div className="absolute" style={{ top: 50, left: "50%", transform: "translateX(-50%)" }}>
              <svg
                className="al-wave"
                width="120"
                height="12"
                viewBox="0 0 120 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ overflow: "visible" }}
              >
                <path
                  d="M0,5 C12,1 26,9 40,5 C54,1 68,9 80,5 C94,1 108,9 120,5"
                  stroke="rgba(74,222,128,0.5)"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M0,9 C12,5 26,13 40,9 C54,5 68,13 80,9 C94,5 108,13 120,9"
                  stroke="rgba(74,222,128,0.2)"
                  strokeWidth="0.8"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

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
