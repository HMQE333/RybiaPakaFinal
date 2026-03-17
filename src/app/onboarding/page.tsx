import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSessionSafe } from "@/lib/auth";
import { getVoivodeshipLabel, voivodeshipKeys } from "@/const";
import OnboardingWizard from "./OnboardingWizard";

async function getOnboardingData() {
  try {
    const headerList = await headers();
    const session = await getSessionSafe(headerList);
    if (!session?.user) return null;

    const rawId = session.user.id ?? "";
    const parsed = Number(rawId);
    if (!Number.isInteger(parsed) || parsed <= 0) return null;

    const user = await prisma.user.findUnique({
      where: { id: parsed },
      select: {
        id: true,
        nick: true,
        name: true,
        pronouns: true,
        bio: true,
        age: true,
        avatarUrl: true,
        bannerUrl: true,
        regionId: true,
        onboardingCompletedAt: true,
        methods: { include: { method: true } },
      },
    });

    return user;
  } catch {
    return null;
  }
}

async function ensureRegions() {
  const existing = await prisma.region.findMany({ orderBy: { name: "asc" } });
  const existingNames = new Set(existing.map((r) => r.name));
  const missing = voivodeshipKeys.filter((n) => !existingNames.has(n));
  if (missing.length === 0) return existing;

  await prisma.region.createMany({
    data: missing.map((name) => ({ name })),
    skipDuplicates: true,
  });
  return prisma.region.findMany({ orderBy: { name: "asc" } });
}

export default async function OnboardingPage() {
  const user = await getOnboardingData();

  if (!user) {
    redirect("/logowanie?redirect=/onboarding");
  }

  if (user.onboardingCompletedAt) {
    redirect("/");
  }

  const [regions, methods] = await Promise.all([
    ensureRegions(),
    prisma.fishingMethod.findMany({ orderBy: { name: "asc" } }),
  ]);

  const regionOptions = regions
    .map((r) => ({
      id: r.id,
      name: getVoivodeshipLabel(r.name) ?? r.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pl-PL"));

  return (
    <OnboardingWizard
      user={{
        nick: user.nick,
        name: user.name,
        pronouns: user.pronouns,
        bio: user.bio,
        age: user.age,
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl,
        regionId: user.regionId,
        methods: user.methods.map((m) => m.method.id),
      }}
      regions={regionOptions}
      methods={methods.map((m) => ({ id: m.id, name: m.name }))}
    />
  );
}
