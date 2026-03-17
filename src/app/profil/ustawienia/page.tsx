import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import Page from "@/components/Page";
import prisma from "@/lib/prisma";
import { getSessionSafe } from "@/lib/auth";
import { getVoivodeshipLabel, voivodeshipKeys } from "@/const";
import ProfileSettingsForm from "./ProfileSettingsForm";

async function getSessionUser() {
  try {
    const headerList = await headers();
    const session = await getSessionSafe(headerList);
    const sessionUser = session?.user;
    if (!sessionUser) {
      return null;
    }

    const include = {
      region: true,
      methods: { include: { method: true } },
    };

    const rawId = sessionUser.id ?? "";
    const parsed = Number(rawId);
    if (Number.isInteger(parsed) && parsed > 0) {
      const user = await prisma.user.findUnique({
        where: { id: parsed },
        include,
      });
      if (user) {
        return user;
      }
    }

    const email =
      typeof sessionUser.email === "string" ? sessionUser.email.trim() : "";
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include,
      });
      if (user) {
        return user;
      }
    }

    const handle =
      (typeof sessionUser.username === "string"
        ? sessionUser.username.trim()
        : "") ||
      (typeof sessionUser.nick === "string" ? sessionUser.nick.trim() : "") ||
      (typeof sessionUser.name === "string" ? sessionUser.name.trim() : "");

    if (!handle) {
      return null;
    }

    return prisma.user.findFirst({
      where: { OR: [{ username: handle }, { nick: handle }, { name: handle }] },
      include,
    });
  } catch {
    return null;
  }

  return null;
}

async function ensureRegions() {
  const existing = await prisma.region.findMany({ orderBy: { name: "asc" } });
  const existingNames = new Set(existing.map((region) => region.name));
  const missingNames = voivodeshipKeys.filter(
    (name) => !existingNames.has(name)
  );

  if (missingNames.length === 0) {
    return existing;
  }

  await prisma.$transaction(
    missingNames.map((name) =>
      prisma.region.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  return prisma.region.findMany({ orderBy: { name: "asc" } });
}

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams?: { onboarding?: string };
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/logowanie");
  }

  const [regions, methods] = await Promise.all([
    ensureRegions(),
    prisma.fishingMethod.findMany({ orderBy: { name: "asc" } }),
  ]);

  const selectedMethods = user.methods.map((method) => method.method.name);
  const regionOptions = regions
    .map((region) => ({
      id: region.id,
      name: getVoivodeshipLabel(region.name) ?? region.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pl-PL"));

  return (
    <Page>
      <div className="w-full flex flex-col items-center pt-[140px] pb-20 px-4">
        <div className="w-full max-w-5xl space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3/90 via-background-2/90 to-background-3/80 p-6 sm:p-7 shadow-[0_12px_50px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_15%_20%,rgba(0,206,0,0.12),transparent_45%)]" />
            <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_85%_15%,rgba(0,150,255,0.12),transparent_50%)]" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
                  Konto
                </span>
                <h1 className="mt-2 text-2xl font-semibold text-foreground">
                  Ustawienia profilu
                </h1>
                <p className="text-sm text-foreground-2">
                  Zarządzaj danymi, które widzą inni użytkownicy.
                </p>
              </div>
              <Link
                href="/profil"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-background-2/80 px-4 py-2 text-sm text-foreground-2 transition hover:border-white/20 hover:text-foreground"
              >
                Podgląd profilu
              </Link>
            </div>
          </div>

          <ProfileSettingsForm
            user={{
              username: user.username,
              nick: user.nick,
              email: user.email,
              bio: user.bio,
              age: user.age,
              avatarUrl: user.avatarUrl,
              regionId: user.regionId,
              methods: selectedMethods,
            }}
            regions={regionOptions}
            methods={methods.map((method) => ({
              id: method.id,
              name: method.name,
            }))}
            onboarding={searchParams?.onboarding === "1"}
          />
        </div>
      </div>
    </Page>
  );
}
