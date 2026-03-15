import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { AdminAuthError, requireAdminFromHeaders } from "@/lib/adminAccess";
import { ReportStatus } from "@/lib/prismaEnums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

  const [count, items] = await Promise.all([
    prisma.report.count({ where: { status: ReportStatus.PENDING } }),
    prisma.report.findMany({
      where: { status: ReportStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    count,
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}
