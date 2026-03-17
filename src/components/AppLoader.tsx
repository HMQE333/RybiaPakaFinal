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
        @keyframes al-ripple-idle {
          0%   { transform: translateX(-50%) scale(0.3); opacity: 0.6; }
          100% { transform: translateX(-50%) scale(1);   opacity: 0; }
        }
        @keyframes al-ripple-idle2 {
          0%   { transform: translateX(-50%) scale(0.2); opacity: 0.45; }
          100% { transform: translateX(-50%) scale(0.85); opacity: 0; }
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
        @keyframes al-ripple-exit {
          0%   { transform: translate(-50%,-50%) scale(0);  opacity: 0.7; }
          100% { transform: translate(-50%,-50%) scale(45); opacity: 0; }
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

        .al-ripple-idle {
          animation: al-ripple-idle 2.8s ease-out infinite;
        }
        .al-ripple-idle2 {
          animation: al-ripple-idle2 2.8s ease-out 1.4s infinite;
        }
        .al-ripple-exit {
          animation: al-ripple-exit 1.3s cubic-bezier(0.1, 0, 0.4, 1) forwards;
          animation-delay: 0.55s;
        }
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
        {exiting && (
          <div
            className="al-ripple-exit pointer-events-none absolute rounded-full"
            style={{
              left: "50%",
              top: "44%",
              width: 72,
              height: 72,
              background:
                "radial-gradient(circle, rgba(74,222,128,0.35) 0%, rgba(34,197,94,0.15) 55%, transparent 80%)",
            }}
          />
        )}

        <div className="flex flex-col items-center gap-8 select-none">
          <div className="relative flex flex-col items-center" style={{ width: 110, height: 210 }}>
            {/* Idle water ripple rings */}
            {!exiting && (
              <>
                <div
                  className="al-ripple-idle absolute rounded-full border border-green-400/30"
                  style={{ top: 84, left: "50%", width: 90, height: 18 }}
                />
                <div
                  className="al-ripple-idle2 absolute rounded-full border border-green-400/20"
                  style={{ top: 84, left: "50%", width: 90, height: 18 }}
                />
              </>
            )}

            {/* Bobber */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 ${exiting ? "al-sink" : "al-bob"}`}
              style={{ top: 16, transformOrigin: "center bottom" }}
            >
              <svg
                width="52"
                height="148"
                viewBox="0 0 52 148"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: "drop-shadow(0 4px 18px rgba(34,197,94,0.38)) drop-shadow(0 1px 4px rgba(0,0,0,0.45))" }}
              >
                {/* Top stick */}
                <rect x="23" y="0" width="6" height="26" rx="3" fill="url(#stickGrad)" />

                {/* Body – green top half */}
                <ellipse cx="26" cy="68" rx="22" ry="34" fill="url(#greenGrad)" clipPath="url(#aboveWater)" />

                {/* Body – white bottom half */}
                <ellipse cx="26" cy="68" rx="22" ry="34" fill="url(#whiteGrad)" clipPath="url(#belowWater)" />

                {/* Thin equator ring */}
                <ellipse cx="26" cy="68" rx="22" ry="2.5" fill="rgba(0,0,0,0.18)" />

                {/* Specular highlight */}
                <ellipse cx="17" cy="52" rx="5" ry="10" fill="white" opacity="0.22" />

                {/* Bottom stick */}
                <rect x="23" y="100" width="6" height="22" rx="3" fill="url(#bottomStickGrad)" />

                {/* Bottom tip cap */}
                <ellipse cx="26" cy="122" rx="5" ry="3" fill="#6b7280" opacity="0.7" />

                <defs>
                  <clipPath id="aboveWater">
                    <rect x="0" y="0" width="52" height="68" />
                  </clipPath>
                  <clipPath id="belowWater">
                    <rect x="0" y="68" width="52" height="40" />
                  </clipPath>

                  <linearGradient id="stickGrad" x1="26" y1="0" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>

                  <linearGradient id="greenGrad" x1="4" y1="34" x2="48" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#86efac" />
                    <stop offset="40%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#14532d" />
                  </linearGradient>

                  <linearGradient id="whiteGrad" x1="4" y1="68" x2="48" y2="108" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f0fdf4" />
                    <stop offset="100%" stopColor="#9ca3af" />
                  </linearGradient>

                  <linearGradient id="bottomStickGrad" x1="26" y1="100" x2="26" y2="122" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#d1d5db" />
                    <stop offset="100%" stopColor="#6b7280" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Water surface waves */}
            <div className="absolute" style={{ top: 82, left: "50%", transform: "translateX(-50%)" }}>
              <svg
                className="al-wave"
                width="150"
                height="16"
                viewBox="0 0 150 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ overflow: "visible" }}
              >
                <path
                  d="M0,6 C16,0 34,12 50,6 C66,0 84,12 100,6 C116,0 134,12 150,6"
                  stroke="rgba(74,222,128,0.45)"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M0,11 C16,5 34,17 50,11 C66,5 84,17 100,11 C116,5 134,17 150,11"
                  stroke="rgba(74,222,128,0.22)"
                  strokeWidth="1.2"
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
