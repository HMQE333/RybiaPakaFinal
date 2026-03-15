import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.siteSetting.findMany();
  const map = Object.fromEntries(items.map((i) => [i.key, i.value]));

  return NextResponse.json(
    {
      siteName: map.siteName ?? "RybiaPaka.pl",
      maintenance: map.maintenanceMode === "true",
      headerBadge: map.headerBadge ?? "",
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}

