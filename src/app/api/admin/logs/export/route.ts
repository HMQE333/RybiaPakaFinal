import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { AdminAuthError, requireAdminFromHeaders } from "@/lib/adminAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeCsv(value: string) {
  const safe = String(value ?? "");
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }

  const format = (req.nextUrl.searchParams.get("format") ?? "csv")
    .trim()
    .toLowerCase();

  const logs = await prisma.adminLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
    include: {
      actor: {
        select: { email: true, username: true, nick: true },
      },
    },
  });

  const payload = logs.map((log) => ({
    id: log.id,
    time: log.createdAt.toISOString(),
    level: log.level,
    message: log.message,
    actor:
      log.actor?.username ||
      log.actor?.nick ||
      (log.actor?.email ? log.actor.email.split("@")[0] : null),
    actorEmail: log.actor?.email ?? null,
    context: log.context ?? null,
  }));

  if (format === "json") {
    return NextResponse.json({ logs: payload }, { status: 200 });
  }

  const header = ["time", "level", "message", "actor", "actorEmail", "context"];
  const rows = payload.map((row) => [
    escapeCsv(row.time),
    escapeCsv(row.level),
    escapeCsv(row.message),
    escapeCsv(row.actor ?? ""),
    escapeCsv(row.actorEmail ?? ""),
    escapeCsv(row.context ?? ""),
  ]);

  const csv = [header.map(escapeCsv).join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="admin-logs.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

