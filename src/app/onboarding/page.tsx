import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSessionSafe } from "@/lib/auth";
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
        pronouns: true,
        bio: true,
        ageRange: true,
        avatarUrl: true,
        bannerUrl: true,
        onboardingCompletedAt: true,
        methods: { include: { method: true } },
      },
    });

    return user;
  } catch {
    return null;
  }
}

export default async function OnboardingPage() {
  const user = await getOnboardingData();

  if (!user) {
    redirect("/logowanie?redirect=/onboarding");
  }

  if (user.onboardingCompletedAt) {
    redirect("/");
  }

  const methods = await prisma.fishingMethod.findMany({ orderBy: { name: "asc" } });

  return (
    <OnboardingWizard
      user={{
        nick: user.nick,
        pronouns: user.pronouns,
        bio: user.bio,
        ageRange: user.ageRange,
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl,
        methods: user.methods.map((m) => m.method.id),
      }}
      methods={methods.map((m) => ({ id: m.id, name: m.name }))}
    />
  );
}
