import { headers } from "next/headers";

import Page from "@/components/Page";
import { getSessionSafe } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureGalleryTables } from "@/app/api/galeria/_utils";

import Hero from "./home/components/Hero";
import Sponsors from "./home/components/Sponsors";
import Statistics, { StatItem } from "./home/components/Statistics";
import Tutorials from "./home/components/Tutorials";
import NavigationTutorial from "./home/components/NavigationTutorial";
import WhyUs from "./home/components/WhyUs";
import Reviews from "./home/components/Reviews";
import BottomCTA from "./home/components/BottomCTA";
import MediaScrolls from "./home/components/MediaScrolls";
import WelcomeModal from "./home/components/WelcomeModal";

export const dynamic = "force-dynamic";

async function fetchGalleryPhotoCount() {
  try {
    await ensureGalleryTables();
    const rows = await prisma.$queryRaw<
      Array<{ count: number | bigint | null }>
    >`SELECT COUNT(*) as count FROM "GalleryItem" WHERE "deletedAt" IS NULL;`;
    const count = Number(rows?.[0]?.count ?? 0);
    return Number.isFinite(count) ? count : 0;
  } catch {
    return 0;
  }
}

async function getStats(): Promise<StatItem[]> {
  const [users, threads, comments, photos] = await Promise.all([
    prisma.user.count(),
    prisma.thread.count(),
    prisma.post.count(),
    fetchGalleryPhotoCount(),
  ]);

  const format = (value: number) => {
    const safe = Math.max(0, value);
    if (safe === 0) return "0";
    if (safe >= 1_000_000) return `${(safe / 1_000_000).toFixed(1)}m+`;
    if (safe >= 10_000) return `${Math.round(safe / 1_000)}k+`;
    if (safe >= 1_000) return `${(safe / 1_000).toFixed(1)}k+`;
    return `${safe.toLocaleString("pl-PL")}+`;
  };

  return [
    { label: "Użytkownicy", value: format(users) },
    { label: "Posty", value: format(threads) },
    { label: "Zdjęcia", value: format(photos) },
    { label: "Komentarze", value: format(comments) },
  ];
}

async function getSession() {
  try {
    const headerList = await headers();
    const session = await getSessionSafe(headerList);
    return session as unknown as { user?: { id: string } } | null;
  } catch {
    return null;
  }
}

function LoggedOut({ stats }: { stats: StatItem[] }) {
  return (
    <Page>
      <WelcomeModal />
      <div className="w-full flex flex-col items-center pt-[140px]">
        <Hero />
        <Statistics stats={stats} />
        <Tutorials />
        <NavigationTutorial />
        <WhyUs />
        <Reviews />
        <MediaScrolls />
        <Sponsors />
        <BottomCTA />
      </div>
    </Page>
  );
}

function LoggedIn({ stats }: { stats: StatItem[] }) {
  return (
    <Page>
      <WelcomeModal />
      <div className="w-full flex flex-col items-center pt-[140px]">
        <Hero variant="dashboard" />
        <Statistics stats={stats} />
        <Tutorials />
        <NavigationTutorial />
        <WhyUs />
        <Reviews />
        <MediaScrolls />
        <Sponsors />
        <BottomCTA />
      </div>
    </Page>
  );
}

export default async function HomePage() {
  const [session, stats] = await Promise.all([getSession(), getStats()]);
  const isLoggedIn = Boolean(session?.user);

  return isLoggedIn ? <LoggedIn stats={stats} /> : <LoggedOut stats={stats} />;
}





