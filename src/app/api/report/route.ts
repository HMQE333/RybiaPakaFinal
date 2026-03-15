import { NextResponse } from "next/server";

import { getSessionSafe } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ReportCategory, ReportStatus } from "@/lib/prismaEnums";

const reasonMap: Record<string, ReportCategory> = {
  bug: ReportCategory.BUG,
  user: ReportCategory.USER,
  suggestion: ReportCategory.SUGGESTION,
  content: ReportCategory.CONTENT,
  spam: ReportCategory.SPAM,
  other: ReportCategory.OTHER,
};

function toCategory(reason: string) {
  return reasonMap[reason.toLowerCase()] ?? ReportCategory.OTHER;
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const title = (body?.title ?? "").toString().trim();
  const description = (body?.description ?? "").toString().trim();
  const context = (body?.context ?? "").toString().trim();
  const attachmentUrl = (body?.attachmentUrl ?? "").toString().trim();
  const reason = (body?.reason ?? "").toString().trim();
  const targetType = (body?.targetType ?? "").toString().trim();
  const targetId = (body?.targetId ?? "").toString().trim();

  const details = [
    description,
    context ? `Kontekst: ${context}` : "",
    attachmentUrl ? `Załącznik: ${attachmentUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const parsedReporterId = Number(body?.reporterId);
  let reporterId =
    Number.isInteger(parsedReporterId) && parsedReporterId > 0
      ? parsedReporterId
      : undefined;

  try {
    const session = await getSessionSafe(req.headers);
    const parsed = Number(session?.user?.id ?? "");
    if (Number.isInteger(parsed) && parsed > 0) {
      reporterId = parsed;
    }
  } catch {
    // ignore session errors
  }

  if (!title || !reason) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  try {
    const report = await prisma.report.create({
      data: {
        title: title.slice(0, 200),
        description: details ? details.slice(0, 2000) : null,
        category: toCategory(reason),
        status: ReportStatus.PENDING,
        targetType: targetType || null,
        targetId: targetId || null,
        reporterId,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: report.id }, { status: 201 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to save report", err);
    return NextResponse.json({ error: "FAILED_TO_SAVE" }, { status: 500 });
  }
}
