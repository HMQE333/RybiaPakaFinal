import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ensureGalleryTables } from "@/app/api/galeria/_utils";
import {
  ensureChannelMessageArchiveTable,
  ensureChannelMessageTable,
} from "@/app/api/dyskusje/messages/_utils";
import { AdminAuthError, requireAdminFromHeaders } from "@/lib/adminAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function markPostTreeRestored(postId: number) {
  return prisma.$executeRaw`
    WITH RECURSIVE descendants(id) AS (
      SELECT "id" FROM "Post" WHERE "id" = ${postId}
      UNION ALL
      SELECT p."id" FROM "Post" p
      JOIN descendants d ON p."parentId" = d."id"
    )
    UPDATE "Post" SET "deletedAt" = NULL
    WHERE "id" IN (SELECT id FROM descendants);
  `;
}

function markGalleryCommentTreeRestored(commentId: string) {
  return prisma.$executeRaw`
    WITH RECURSIVE descendants(id) AS (
      SELECT "id" FROM "GalleryComment" WHERE "id" = ${commentId}
      UNION ALL
      SELECT gc."id" FROM "GalleryComment" gc
      JOIN descendants d ON gc."parentId" = d."id"
    )
    UPDATE "GalleryComment" SET "deletedAt" = NULL
    WHERE "id" IN (SELECT id FROM descendants);
  `;
}

type ChannelMessageArchiveRow = {
  archiveId: string;
  messageId: string;
  channelId: string;
  authorId: number | null;
  authorName: string | null;
  text: string;
  createdAt: string | Date;
  hiddenAt: string | Date | null;
  hiddenById: number | null;
};

const toDate = (value: string | Date | null) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed;
};

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: { archiveId: string } | Promise<{ archiveId: string }> }
) {
  const { archiveId } = await params;
  const id = String(archiveId ?? "").trim();
  if (!id) return jsonError("INVALID_ARCHIVE", 400);

  let viewer;
  try {
    viewer = await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

  const entry = await prisma.contentArchive.findUnique({
    where: { id },
  });

  if (!entry) return jsonError("ARCHIVE_NOT_FOUND", 404);
  if (entry.restoredAt) return jsonError("ALREADY_RESTORED", 409);
  if (entry.expiresAt.getTime() <= Date.now()) {
    return jsonError("ARCHIVE_EXPIRED", 410);
  }

  const targetType = entry.targetType.toLowerCase();
  const targetId = entry.targetId;
  const restoredAt = new Date();

  if (targetType === "thread") {
    const threadId = Number(targetId);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      return jsonError("INVALID_TARGET", 400);
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true },
    });
    if (!thread) return jsonError("TARGET_NOT_FOUND", 404);

    await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: { deletedAt: null },
      }),
      prisma.post.updateMany({
        where: { threadId },
        data: { deletedAt: null },
      }),
      prisma.contentArchive.update({
        where: { id },
        data: { restoredAt },
      }),
    ]);
  } else if (targetType === "post") {
    const postId = Number(targetId);
    if (!Number.isInteger(postId) || postId <= 0) {
      return jsonError("INVALID_TARGET", 400);
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) return jsonError("TARGET_NOT_FOUND", 404);

    await prisma.$transaction([
      markPostTreeRestored(postId),
      prisma.contentArchive.update({
        where: { id },
        data: { restoredAt },
      }),
    ]);
  } else if (targetType === "gallery-item") {
    await ensureGalleryTables();
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "GalleryItem" WHERE "id" = ${targetId} LIMIT 1;
    `;
    if (!rows.length) return jsonError("TARGET_NOT_FOUND", 404);

    await prisma.$transaction([
      prisma.$executeRaw`
        UPDATE "GalleryItem" SET "deletedAt" = NULL WHERE "id" = ${targetId};
      `,
      prisma.$executeRaw`
        UPDATE "GalleryComment" SET "deletedAt" = NULL WHERE "itemId" = ${targetId};
      `,
      prisma.contentArchive.update({
        where: { id },
        data: { restoredAt },
      }),
    ]);
  } else if (targetType === "gallery-comment") {
    await ensureGalleryTables();
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "GalleryComment" WHERE "id" = ${targetId} LIMIT 1;
    `;
    if (!rows.length) return jsonError("TARGET_NOT_FOUND", 404);

    await prisma.$transaction([
      markGalleryCommentTreeRestored(targetId),
      prisma.contentArchive.update({
        where: { id },
        data: { restoredAt },
      }),
    ]);
  } else if (targetType === "channel-message") {
    await ensureChannelMessageTable();
    await ensureChannelMessageArchiveTable();
    const rows = await prisma.$queryRaw<ChannelMessageArchiveRow[]>`
      SELECT
        "archiveId",
        "messageId",
        "channelId",
        "authorId",
        "authorName",
        "text",
        "createdAt",
        "hiddenAt",
        "hiddenById"
      FROM "ChannelMessageArchive"
      WHERE "archiveId" = ${id}
      LIMIT 1;
    `;
    const archived = rows[0];
    if (!archived) return jsonError("ARCHIVE_PAYLOAD_MISSING", 404);

    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "ChannelMessage" WHERE "id" = ${archived.messageId} LIMIT 1;
    `;
    if (existing.length) return jsonError("TARGET_ALREADY_EXISTS", 409);

    const createdAt = toDate(archived.createdAt) ?? new Date();
    const hiddenAt = toDate(archived.hiddenAt);

    await prisma.$transaction([
      prisma.$executeRaw`
        INSERT INTO "ChannelMessage" (
          "id",
          "channelId",
          "authorId",
          "authorName",
          "text",
          "createdAt",
          "hiddenAt",
          "hiddenById"
        )
        VALUES (
          ${archived.messageId},
          ${archived.channelId},
          ${archived.authorId},
          ${archived.authorName},
          ${archived.text},
          ${createdAt},
          ${hiddenAt},
          ${archived.hiddenById}
        );
      `,
      prisma.contentArchive.update({
        where: { id },
        data: { restoredAt },
      }),
    ]);
  } else {
    return jsonError("UNSUPPORTED_TARGET", 422);
  }

  await prisma.adminLog.create({
    data: {
      actorId: viewer.id,
      level: "INFO",
      message: `Przywrócono treść (${targetType}) z archiwum.`,
      context: JSON.stringify({
        action: "ARCHIVE_RESTORE",
        archiveId: id,
        targetType,
        targetId,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
