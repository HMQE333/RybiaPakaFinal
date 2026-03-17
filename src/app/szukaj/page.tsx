import Header from "@/components/Header";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import prisma from "@/lib/prisma";
import { getVoivodeshipLabel, voivodeshipKeys } from "@/const";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";

type RegionOption = {
  id: string;
  name: string;
};

type MethodOption = {
  id: string;
  name: string;
};

async function ensureRegions() {
  const existing = await prisma.region.findMany({ orderBy: { name: "asc" } });
  const existingNames = new Set(existing.map((region) => region.name));
  const missing = voivodeshipKeys.filter((name) => !existingNames.has(name));

  if (missing.length === 0) {
    return existing;
  }

  await prisma.$transaction(
    missing.map((name) =>
      prisma.region.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  return prisma.region.findMany({ orderBy: { name: "asc" } });
}

export default async function SearchPage() {
  const [regions, methods] = await Promise.all([
    ensureRegions(),
    prisma.fishingMethod.findMany({ orderBy: { name: "asc" } }),
  ]);

  const regionOptions: RegionOption[] = regions
    .map((region) => ({
      id: region.id,
      name: getVoivodeshipLabel(region.name) ?? region.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pl-PL"));

  const methodOptions: MethodOption[] = methods.map((method) => ({
    id: method.id,
    name: method.name,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-[180px] pb-16">
        <Suspense fallback={null}>
          <SearchClient regions={regionOptions} methods={methodOptions} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
