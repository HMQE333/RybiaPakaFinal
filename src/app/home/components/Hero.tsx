"use client";

import { cn } from "@/utils";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Fish,
  Home,
  Images,
  LifeBuoy,
  Mail,
  MapPin,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthEvent } from "@/lib/authEvents";
import { onMissionEvent } from "@/lib/missionEvents";
import { DAILY_MISSIONS, type DailyMissionId } from "@/lib/missions";

interface SwimmingFish {
  id: number;
  top: number;
  size: number;
  duration: number;
}

type HeroVariant = "default" | "dashboard";

type HeroProps = {
  variant?: HeroVariant;
};

type DashboardStop = {
  id: string;
  title: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  status?: "current" | "next" | "done" | "locked";
  badge?: string;
  offsetClass?: string;
};

type DailyMission = {
  id: DailyMissionId;
  title: string;
  goal: number;
  count: number;
};

type MissionPayload = {
  id: DailyMissionId;
  goal: number;
  count?: number;
};

const DASHBOARD_STOPS: DashboardStop[] = [
  {
    id: "home",
    title: "Strona Główna",
    description: "Start i podsumowanie",
    href: "/",
    Icon: Home,
    status: "current",
    badge: "START",
    offsetClass: "-translate-x-10 sm:-translate-x-16",
  },
  {
    id: "dyskusje",
    title: "Dyskusje",
    description: "Rozmowy na żywo",
    href: "/dyskusje",
    Icon: Compass,
    status: "next",
    badge: "NA ŻYWO",
    offsetClass: "translate-x-6 sm:translate-x-14",
  },
  {
    id: "forum",
    title: "Forum",
    description: "Nowe wątki",
    href: "/forum",
    Icon: MessageSquare,
    status: "next",
    badge: "WĄTKI",
    offsetClass: "-translate-x-4 sm:-translate-x-12",
  },
  {
    id: "galeria",
    title: "Galeria",
    description: "Świeże okazy",
    href: "/galeria",
    Icon: Images,
    status: "next",
    offsetClass: "translate-x-12 sm:translate-x-20",
  },
  {
    id: "informacje",
    title: "Informacje",
    description: "Poradniki i newsy",
    href: "/informacje",
    Icon: MapPin,
    status: "next",
    offsetClass: "-translate-x-12 sm:-translate-x-20",
  },
  {
    id: "kontakt",
    title: "Kontakt",
    description: "Napisz do nas",
    href: "/kontakt",
    Icon: Mail,
    status: "next",
    offsetClass: "translate-x-2 sm:translate-x-10",
  },
  {
    id: "zglos-problem",
    title: "Zgłoś problem",
    description: "Zgłoś problem",
    href: "/zglos-problem",
    Icon: LifeBuoy,
    status: "next",
    offsetClass: "translate-x-12 sm:translate-x-18",
  },
];

const QUICK_ACTIONS = [
  {
    title: "Nowy wątek na forum",
    description: "Zacznij rozmowę ze społecznością",
    href: "/forum",
    Icon: MessageSquare,
  },
  {
    title: "Dołącz do dyskusji",
    description: "Rozmowy na żywo i metody wędkarskie",
    href: "/dyskusje",
    Icon: Compass,
  },
  {
    title: "Dodaj zdjęcie",
    description: "Pokaż swój ostatni okaz",
    href: "/galeria",
    Icon: Images,
  },
];

const RADAR_ITEMS = [
  {
    label: "Forum",
    description: "Nowe tematy i odpowiedzi",
  },
  {
    label: "Dyskusje",
    description: "Aktywne rozmowy live",
  },
  {
    label: "Galeria",
    description: "Świeże zdjęcia od wędkarzy",
  },
];

const MISSION_TITLES: Record<DailyMissionId, string> = {
  post: "Dodaj post lub wątek",
  discussion: "Odpowiedz w dyskusji",
  photo: "Dodaj zdjęcie",
};

const STOP_TONES = {
  current: {
    shell:
      "border-[var(--accent)] bg-[var(--accent)] text-black shadow-[0_0_30px_rgba(0,206,0,0.45)]",
    ring: "border-[var(--accent)]/50",
  },
  done: {
    shell:
      "border-[var(--accent)]/40 bg-[var(--background-3)] text-[var(--accent)]",
    ring: "border-[var(--accent)]/30",
  },
  next: {
    shell: "border-white/10 bg-[var(--background-4)] text-[var(--foreground)]",
    ring: "border-white/10",
  },
  locked: {
    shell:
      "border-white/5 bg-[var(--background-4)] text-[var(--foreground-2)]",
    ring: "border-white/5",
  },
} as const;

export default function Hero({ variant = "default" }: HeroProps) {
  const [fishes, setFishes] = useState<SwimmingFish[]>([]);
  const fishCounter = useRef(0);
  const isDashboard = variant === "dashboard";
  const initialDashboard = useRef(isDashboard);
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>(() =>
    DAILY_MISSIONS.map((mission) => ({
      ...mission,
      title: MISSION_TITLES[mission.id],
      count: 0,
    }))
  );

  const resetMissions = useCallback(() => {
    setDailyMissions(
      DAILY_MISSIONS.map((mission) => ({
        ...mission,
        title: MISSION_TITLES[mission.id],
        count: 0,
      }))
    );
  }, []);

  const refreshDailyMissions = useCallback(async () => {
    try {
      const res = await fetch("/api/missions/daily", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json().catch(() => null);
      if (!Array.isArray(data?.missions)) {
        return;
      }
      if (data?.authenticated === false) {
        resetMissions();
        return;
      }
      const payload = new Map<DailyMissionId, MissionPayload>();
      data.missions.forEach((mission: MissionPayload) => {
        if (!mission?.id) return;
        payload.set(mission.id, mission);
      });
      setDailyMissions(
        DAILY_MISSIONS.map((mission) => {
          const found = payload.get(mission.id);
          return {
            id: mission.id,
            title: MISSION_TITLES[mission.id],
            goal: found?.goal ?? mission.goal,
            count: found?.count ?? 0,
          };
        })
      );
    } catch {
      return;
    }
  }, [resetMissions]);

  useEffect(() => {
    if (!isDashboard) return;
    refreshDailyMissions();
    const offAuth = onAuthEvent((detail) => {
      if (detail.type === "logout") {
        resetMissions();
        return;
      }
      refreshDailyMissions();
    });
    const offMission = onMissionEvent((detail) => {
      if (detail.id) {
        setDailyMissions((prev) =>
          prev.map((mission) => {
            if (mission.id !== detail.id) return mission;
            const safeGoal = mission.goal > 0 ? mission.goal : 1;
            const nextCount = Math.min(mission.count + 1, safeGoal);
            return { ...mission, count: nextCount };
          })
        );
      }
      refreshDailyMissions();
    });
    return () => {
      offAuth?.();
      offMission?.();
    };
  }, [isDashboard, refreshDailyMissions, resetMissions]);

  useEffect(() => {
    const dashboardMode = initialDashboard.current;
    setFishes([]);
    fishCounter.current = 0;

    const spawnFish = () => {
      const id = fishCounter.current++;
      const top = Math.random() * 70 + 10;
      const size = Math.random() * (dashboardMode ? 14 : 20) + 14;
      const duration = Math.random() * (dashboardMode ? 12 : 10) + 10;

      setFishes((prev) => [...prev, { id, top, size, duration }]);

      setTimeout(() => {
        setFishes((prev) => prev.filter((f) => f.id !== id));
      }, duration * 1000);
    };

    const interval = setInterval(spawnFish, dashboardMode ? 1100 : 700);
    const initialBurst = dashboardMode ? 4 : 6;

    for (let i = 0; i < initialBurst; i += 1) {
      spawnFish();
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className={cn(
        "relative w-screen",
        isDashboard
          ? "h-[calc(100vh-140px)] mb-12 flex items-start justify-center px-4 sm:px-6 xl:px-0 overflow-x-hidden overflow-y-visible"
          : "h-screen px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center overflow-hidden"
      )}
    >
      {!isDashboard && (
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] to-[var(--background-2)] z-0" />
      )}
      {isDashboard && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[var(--background-2)] to-[var(--background)] z-0" />
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(0,206,0,0.18),transparent_50%)]" />
          <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_80%_10%,rgba(0,206,0,0.12),transparent_45%)]" />
          
        </>
      )}

      {fishes.map((fish) => (
        <div
          key={fish.id}
          className="fish-animation absolute left-[-10%]"
          style={{
            top: `${fish.top}%`,
            animationDuration: `${fish.duration}s`,
          }}
        >
          <Fish
            size={fish.size}
            className={cn(
              "text-[var(--accent)] transform scale-x-100",
              isDashboard ? "opacity-10" : "opacity-20"
            )}
          />
        </div>
      ))}

      {isDashboard ? (
        <div className="relative z-10 h-full w-full max-w-[1920px] max-h-[1080px]">
          <div className="flex h-full w-full flex-col gap-4 rounded-[36px] border border-white/10 bg-gradient-to-br from-[var(--background-3)] via-[var(--background-2)] to-[var(--background-3)] p-4 sm:p-5 lg:p-7 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col items-center justify-center gap-1 text-center">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Pulpit nawigacyjny
              </h1>
            </div>

            <div className="flex-1 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
            <div className="relative h-full overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[var(--background-3)]/90 via-[var(--background-2)]/85 to-[var(--background-3)]/80 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_30%,rgba(0,206,0,0.18),transparent_45%)]" />
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_80%_20%,rgba(0,206,0,0.1),transparent_50%)]" />

              <div className="relative flex h-full flex-col gap-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-white/10 bg-[var(--background-3)]/80 px-4 py-2.5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--foreground-2)]">
                      Szlak 01
                    </p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Droga do najlepszych połowów
                    </p>
                    <p className="text-xs text-[var(--foreground-2)]">
                      Kliknij punkt na trasie, aby przejść dalej.
                    </p>
                  </div>
                  <Link
                    href="/informacje"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--background-4)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
                  >
                    Przewodnik
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="flex flex-1 items-center">
                  <div className="relative w-full max-w-none">
                    <div className="hidden left-1/2 top-6 bottom-6 -translate-x-1/2 w-[3px] bg-gradient-to-b from-transparent via-[var(--accent)]/40 to-transparent" />
                    <div className="hidden left-1/2 top-6 bottom-6 -translate-x-1/2 w-px border-l border-dashed border-[var(--accent)]/35" />

                    <div className="grid gap-2.5">
                      {DASHBOARD_STOPS.map((stop) => {
                        const tone =
                          STOP_TONES[stop.status ?? "next"] || STOP_TONES.next;
                        const isCurrent = stop.status === "current";
                        const isLocked = stop.status === "locked";
                        const isHome = stop.id === "home";
                        const isProfile = stop.id === "profil";
                        const badgeClass = isCurrent
                          ? "bg-[var(--accent)] text-black"
                          : "bg-[var(--accent)]/15 text-[var(--accent)]";
                        const dotClass = isLocked
                          ? "bg-white/15"
                          : isHome
                          ? "bg-[var(--accent)]"
                          : "bg-white/35";
                        const iconClass = cn(
                          isHome ? "text-white" : "text-[var(--accent)]",
                          isLocked && "opacity-60"
                        );
                        const shellClass = cn(
                          "relative flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur",
                          tone.shell,
                          isProfile &&
                            "border-white/10 bg-[var(--background-4)] text-[var(--accent)]"
                        );

                        return (
                          <Link
                            key={stop.id}
                            href={stop.href}
                            className={cn(
                              "group flex items-center gap-3 rounded-3xl border border-white/10 bg-[var(--background-3)]/70 px-4 py-2.5 text-left transition hover:border-[var(--accent)]/40 hover:bg-[var(--background-3)]",
                              isLocked ? "pointer-events-none opacity-60" : ""
                            )}
                          >
                            <span
                              className={cn(
                                "hidden pointer-events-none absolute -inset-4 rounded-full border opacity-70",
                                tone.ring
                              )}
                            />
                            <span
                              className={shellClass}
                            >
                              <stop.Icon size={16} className={iconClass} />
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[var(--foreground)]">
                                  {stop.title}
                                </span>
                                {stop.badge && (
                                  <span
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]",
                                      badgeClass
                                    )}
                                  >
                                    {stop.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--foreground-2)]">
                                {stop.description}
                              </p>
                            </div>
                            <span className={cn("h-2 w-2 rounded-full", dotClass)} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--foreground-2)]">
                  <span>Aktywny szlak: Społeczność RybiaPaka</span>
                  <span className="rounded-full border border-white/10 bg-[var(--background-3)]/70 px-3 py-1 text-[10px] uppercase tracking-[0.2em]">
                    Zielony punkt = Strona, na której jesteś!
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <div className="order-4 hidden rounded-3xl border border-white/10 bg-[var(--background-3)]/80 p-4 shadow-xl">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--foreground-2)]">
                  Tablica wyników
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  Złap kurs na dziś
                </h2>
                <p className="mt-2 text-sm text-[var(--foreground-2)]">
                  Sprawdź swoje cele na dziś i wróć do aktywności, które
                  wybrałeś.
                </p>
                <div className="mt-3 grid gap-2.5">
                  <div className="rounded-2xl border border-white/10 bg-[var(--background-4)]/80 px-4 py-2.5">
                    <div className="flex items-center justify-between text-xs text-[var(--foreground-2)]">
                      <span>Aktywne dziś</span>
                      <span className="text-[var(--accent)]">3/6</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 w-[40%] rounded-full bg-[var(--accent)]" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[var(--background-4)]/80 px-4 py-2.5">
                    <div className="flex items-center justify-between text-xs text-[var(--foreground-2)]">
                      <span>Nowe aktywności</span>
                      <span className="text-[var(--accent)]">2</span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--foreground-2)]">
                      Forum i Dyskusje są teraz najbardziej aktywne.
                    </p>
                  </div>
                </div>
              </div>

              <div className="order-2 rounded-3xl border border-white/10 bg-[var(--background-3)]/80 p-4 shadow-lg">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--foreground-2)]">
                  Misje dnia
                </p>
                <div className="mt-2 space-y-3">
                  {dailyMissions.map((mission) => {
                    const safeGoal = Math.max(1, mission.goal);
                    const completed = Math.min(mission.count, safeGoal);
                    const progress = Math.min(mission.count / safeGoal, 1);
                    return (
                      <div key={mission.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-[var(--foreground-2)]">
                          <span>{mission.title}</span>
                          <span>
                            {completed}/{safeGoal}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-[var(--accent)]"
                            style={{ width: `${progress * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="order-1 rounded-3xl border border-white/10 bg-[var(--background-3)]/80 p-4 shadow-lg">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--foreground-2)]">
                  Szybkie akcje
                </p>
                <div className="mt-2 grid gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--background-3)]/70 px-3 py-1.5 text-left transition hover:border-[var(--accent)]/40 hover:bg-[var(--background-3)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                          <action.Icon size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {action.title}
                          </p>
                          <p className="text-xs text-[var(--foreground-2)]">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-[var(--foreground-2)] transition group-hover:text-[var(--accent)]"
                      />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="order-3 rounded-3xl border border-white/10 bg-[var(--background-3)]/80 p-4 shadow-lg">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--foreground-2)]">
                  Radar społeczności
                </p>
                <div className="mt-2 space-y-2.5">
                  {RADAR_ITEMS.map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-[var(--accent)]/70" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {item.label}
                        </p>
                        <p className="text-xs text-[var(--foreground-2)]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] leading-tight">
            Dołącz do najlepszej <br />
            <span className="text-[var(--accent)]">
              społeczności wędkarskiej
            </span>{" "}
            w Polsce!
          </h1>

          <p className="text-lg md:text-xl text-[var(--foreground-2)] max-w-2xl mx-auto">
            Dziel się swoimi okazami, wymieniaj doświadczeniami i poznawaj
            pasjonatów takich jak Ty. Razem tworzymy historię polskiego
            wędkarstwa.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/rejestracja"
              className={cn(
                "px-8 py-3 rounded-full font-bold text-lg transition-all duration-300",
                "bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] hover:scale-105 shadow-lg shadow-[var(--accent)]/20"
              )}
            >
              Dołącz teraz
            </Link>
            <Link
              href="/logowanie"
              className={cn(
                "px-8 py-3 rounded-full font-bold text-lg transition-all duration-300",
                "bg-[var(--background-3)] text-[var(--foreground)] hover:bg-[var(--background-4)] border border-[var(--background-4)]"
              )}
            >
              Zaloguj się
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
