import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ensureGalleryTables } from "@/app/api/galeria/_utils";
import { AdminAuthError, requireAdminFromHeaders } from "@/lib/adminAccess";
import { ReportStatus } from "@/lib/prismaEnums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isValidReportStatus(value: string) {
  return (Object.values(ReportStatus) as string[]).includes(value);
}

const ARCHIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

type ArchiveTemplate = {
  reportId: string;
  targetType: string;
  targetId: string;
  authorLabel: string;
  reporterLabel: string;
  adminLabel: string;
  createdAt: Date;
  deletedAt: Date;
};

function buildArchiveEntry(data: ArchiveTemplate) {
  return {
    ...data,
    expiresAt: new Date(data.deletedAt.getTime() + ARCHIVE_WINDOW_MS),
  };
}

type LabelUser = {
  username?: string | null;
  nick?: string | null;
  email?: string | null;
  name?: string | null;
};

type GalleryItemRow = {
  id: string;
  createdAt: string | Date;
  deletedAt: string | Date | null;
  authorId: number;
  username: string | null;
  nick: string | null;
  email: string | null;
};

type GalleryCommentRow = {
  id: string;
  createdAt: string | Date;
  deletedAt: string | Date | null;
  authorId: number;
  username: string | null;
  nick: string | null;
  email: string | null;
};

function resolveUserLabel(user?: LabelUser | null) {
  if (!user) return "Anonim";
  return user.username || user.nick || user.email || user.name || "Anonim";
}

function markPostTreeDeleted(postId: number, deletedAt: Date) {
  return prisma.$executeRaw`
    WITH RECURSIVE descendants(id) AS (
      SELECT "id" FROM "Post" WHERE "id" = ${postId}
      UNION ALL
      SELECT p."id" FROM "Post" p
      JOIN descendants d ON p."parentId" = d."id"
    )
    UPDATE "Post" SET "deletedAt" = ${deletedAt}
    WHERE "id" IN (SELECT id FROM descendants);
  `;
}

function markGalleryCommentTreeDeleted(commentId: string, deletedAt: Date) {
  return prisma.$executeRaw`
    WITH RECURSIVE descendants(id) AS (
      SELECT "id" FROM "GalleryComment" WHERE "id" = ${commentId}
      UNION ALL
      SELECT gc."id" FROM "GalleryComment" gc
      JOIN descendants d ON gc."parentId" = d."id"
    )
    UPDATE "GalleryComment" SET "deletedAt" = ${deletedAt}
    WHERE "id" IN (SELECT id FROM descendants);
  `;
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: { reportId: string } | Promise<{ reportId: string }> }
) {
  const { reportId } = await params;
  const id = String(reportId ?? "").trim();
  if (!id) return jsonError("INVALID_REPORT", 400);

  let viewer;
  try {
    viewer = await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", 400);
  }

  const status = String(body?.status ?? "").trim().toUpperCase();
  if (!status || !isValidReportStatus(status)) {
    return jsonError("INVALID_STATUS", 422);
  }

  const existing = await prisma.report.findUnique({
    where: { id },
    select: { id: true, status: true, category: true, title: true },
  });
  if (!existing) return jsonError("REPORT_NOT_FOUND", 404);

  const updated = await prisma.report.update({
    where: { id },
    data: {
      status,
      handledById: viewer.id,
    },
    select: { id: true, status: true },
  });

  await prisma.adminLog.create({
    data: {
      actorId: viewer.id,
      level: "INFO",
      message: `Zmieniono status zgłoszenia (${existing.category}) "${existing.title}" z ${existing.status} na ${status}.`,
      context: JSON.stringify({
        action: "REPORT_STATUS_UPDATE",
        reportId: id,
        from: existing.status,
        to: status,
      }),
    },
  });

  return NextResponse.json({ ok: true, report: updated });
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: { reportId: string } | Promise<{ reportId: string }> }
) {
  const { reportId } = await params;
  const id = String(reportId ?? "").trim();
  if (!id) return jsonError("INVALID_REPORT", 400);

  let viewer;
  try {
    viewer = await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      category: true,
      targetType: true,
      targetId: true,
      reporter: { select: { username: true, nick: true, email: true } },
    },
  });

  if (!report) return jsonError("REPORT_NOT_FOUND", 404);

  const resolveWithoutDelete = async (reason: string) => {
    const updated = await prisma.report.update({
      where: { id },
      data: {
        status: ReportStatus.RESOLVED,
        handledById: viewer.id,
      },
      select: { id: true, status: true },
    });

    await prisma.adminLog.create({
      data: {
        actorId: viewer.id,
        level: "INFO",
        message: `Zamknięto zgłoszenie (${report.category}) "${report.title}" bez usunięcia treści. Powód: ${reason}.`,
        context: JSON.stringify({
          action: "REPORT_RESOLVE_FALLBACK",
          reportId: id,
          reason,
        }),
      },
    });

    return NextResponse.json({ ok: true, report: updated, skipped: reason });
  };

  const targetType = String(report.targetType ?? "")
    .trim()
    .toLowerCase();
  const targetId = String(report.targetId ?? "").trim();

  if (!targetType || !targetId) {
    return resolveWithoutDelete("REPORT_TARGET_MISSING");
  }

  const existingArchive = await prisma.contentArchive.findFirst({
    where: { reportId: id, restoredAt: null },
    select: { id: true },
  });

  if (existingArchive) {
    return resolveWithoutDelete("ALREADY_ARCHIVED");
  }

  const deletedAt = new Date();
  const reporterLabel = resolveUserLabel(report.reporter);
  const adminLabel = resolveUserLabel(viewer);

  if (targetType === "thread") {
    const threadId = Number(targetId);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      return resolveWithoutDelete("INVALID_TARGET");
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        createdAt: true,
        deletedAt: true,
        author: { select: { username: true, nick: true, email: true } },
      },
    });

    if (!thread) return resolveWithoutDelete("TARGET_NOT_FOUND");

    const authorLabel = resolveUserLabel(thread.author);

    await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: { deletedAt },
      }),
      prisma.post.updateMany({
        where: { threadId },
        data: { deletedAt },
      }),
      prisma.contentArchive.create({
        data: buildArchiveEntry({
          reportId: id,
          targetType,
          targetId,
          authorLabel,
          reporterLabel,
          adminLabel,
          createdAt: thread.createdAt,
          deletedAt,
        }),
      }),
      prisma.report.update({
        where: { id },
        data: {
          status: ReportStatus.RESOLVED,
          handledById: viewer.id,
        },
      }),
    ]);
  } else if (targetType === "post") {
    const postId = Number(targetId);
    if (!Number.isInteger(postId) || postId <= 0) {
      return resolveWithoutDelete("INVALID_TARGET");
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        createdAt: true,
        deletedAt: true,
        author: { select: { username: true, nick: true, email: true } },
      },
    });

    if (!post) return resolveWithoutDelete("TARGET_NOT_FOUND");

    const authorLabel = resolveUserLabel(post.author);

    await prisma.$transaction([
      markPostTreeDeleted(postId, deletedAt),
      prisma.contentArchive.create({
        data: buildArchiveEntry({
          reportId: id,
          targetType,
          targetId,
          authorLabel,
          reporterLabel,
          adminLabel,
          createdAt: post.createdAt,
          deletedAt,
        }),
      }),
      prisma.report.update({
        where: { id },
        data: {
          status: ReportStatus.RESOLVED,
          handledById: viewer.id,
        },
      }),
    ]);
  } else if (targetType === "gallery-item") {
    await ensureGalleryTables();
    const rows = await prisma.$queryRaw<GalleryItemRow[]>`
      SELECT
        gi."id",
        gi."createdAt",
        gi."deletedAt",
        gi."authorId",
        u."username",
        u."nick",
        u."email"
      FROM "GalleryItem" gi
      LEFT JOIN "User" u ON u."id" = gi."authorId"
      WHERE gi."id" = ${targetId}
      LIMIT 1;
    `;
    const item = rows[0];
    if (!item) return resolveWithoutDelete("TARGET_NOT_FOUND");

    const authorLabel = resolveUserLabel(item);

    await prisma.$transaction([
      prisma.$executeRaw`
        UPDATE "GalleryItem"
        SET "deletedAt" = ${deletedAt}
        WHERE "id" = ${targetId};
      `,
      prisma.$executeRaw`
        UPDATE "GalleryComment"
        SET "deletedAt" = ${deletedAt}
        WHERE "itemId" = ${targetId};
      `,
      prisma.contentArchive.create({
        data: buildArchiveEntry({
          reportId: id,
          targetType,
          targetId,
          authorLabel,
          reporterLabel,
          adminLabel,
          createdAt: new Date(item.createdAt),
          deletedAt,
        }),
      }),
      prisma.report.update({
        where: { id },
        data: {
          status: ReportStatus.RESOLVED,
          handledById: viewer.id,
        },
      }),
    ]);
  } else if (targetType === "gallery-comment") {
    await ensureGalleryTables();
    const rows = await prisma.$queryRaw<GalleryCommentRow[]>`
      SELECT
        gc."id",
        gc."createdAt",
        gc."deletedAt",
        gc."authorId",
        u."username",
        u."nick",
        u."email"
      FROM "GalleryComment" gc
      LEFT JOIN "User" u ON u."id" = gc."authorId"
      WHERE gc."id" = ${targetId}
      LIMIT 1;
    `;
    const comment = rows[0];
    if (!comment) return resolveWithoutDelete("TARGET_NOT_FOUND");

    const authorLabel = resolveUserLabel(comment);

    await prisma.$transaction([
      markGalleryCommentTreeDeleted(targetId, deletedAt),
      prisma.contentArchive.create({
        data: buildArchiveEntry({
          reportId: id,
          targetType,
          targetId,
          authorLabel,
          reporterLabel,
          adminLabel,
          createdAt: new Date(comment.createdAt),
          deletedAt,
        }),
      }),
      prisma.report.update({
        where: { id },
        data: {
          status: ReportStatus.RESOLVED,
          handledById: viewer.id,
        },
      }),
    ]);
  } else {
    return resolveWithoutDelete("UNSUPPORTED_TARGET");
  }

  await prisma.adminLog.create({
    data: {
      actorId: viewer.id,
      level: "INFO",
      message: `Usunięto treść (${targetType}) w zgłoszeniu "${report.title}".`,
      context: JSON.stringify({
        action: "REPORT_TARGET_DELETE",
        reportId: id,
        targetType,
        targetId,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
