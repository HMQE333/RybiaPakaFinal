import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { AdminAuthError, requireAdminFromHeaders } from "@/lib/adminAccess";
import {
  ensureChannelMessageArchiveTable,
  ensureChannelMessageTable,
} from "../_utils";

type MessageRow = {
  id: string;
  hiddenAt: string | Date | null;
  deletedAt: string | Date | null;
};

type ArchiveMessageRow = {
  id: string;
  channelId: string;
  text: string;
  createdAt: string | Date;
  hiddenAt: string | Date | null;
  hiddenById: number | null;
  deletedAt: string | Date | null;
  authorId: number | null;
  authorName: string | null;
  username: string | null;
  nick: string | null;
  name: string | null;
  email: string | null;
};

type LabelUser = {
  username?: string | null;
  nick?: string | null;
  email?: string | null;
  name?: string | null;
  authorName?: string | null;
};

const ARCHIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getMessageRow(messageId: string) {
  const rows = await prisma.$queryRaw<MessageRow[]>`
    SELECT "id", "hiddenAt", "deletedAt"
    FROM "ChannelMessage"
    WHERE "id" = ${messageId}
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

async function getArchiveMessageRow(messageId: string) {
  const rows = await prisma.$queryRaw<ArchiveMessageRow[]>`
    SELECT
      cm."id",
      cm."channelId",
      cm."text",
      cm."createdAt",
      cm."hiddenAt",
      cm."hiddenById",
      cm."deletedAt",
      cm."authorId",
      cm."authorName",
      u."username",
      u."nick",
      u."name",
      u."email"
    FROM "ChannelMessage" cm
    LEFT JOIN "User" u ON u."id" = cm."authorId"
    WHERE cm."id" = ${messageId}
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

function resolveUserLabel(user?: LabelUser | null) {
  if (!user) return "Anonim";
  return (
    user.username ||
    user.nick ||
    user.email ||
    user.name ||
    user.authorName ||
    "Anonim"
  );
}

const toDate = (value: string | Date | null) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed;
};

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: { messageId: string } | Promise<{ messageId: string }> }
) {
  let viewer;
  try {
    viewer = await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

  await ensureChannelMessageTable();

  const { messageId } = await params;
  if (!messageId) {
    return jsonError("INVALID_MESSAGE", 400);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", 400);
  }

  const action = String(body?.action ?? "").toLowerCase();
  if (action !== "hide" && action !== "unhide") {
    return jsonError("INVALID_ACTION", 400);
  }

  const existing = await getMessageRow(messageId);
  if (!existing) {
    return jsonError("NOT_FOUND", 404);
  }
  if (existing.deletedAt) {
    return jsonError("MESSAGE_DELETED", 409);
  }

  if (action === "hide") {
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      UPDATE "ChannelMessage"
      SET "hiddenAt" = ${now}, "hiddenById" = ${viewer.id}
      WHERE "id" = ${messageId};
    `;
    return NextResponse.json({ message: { id: messageId, hiddenAt: now } });
  }

  await prisma.$executeRaw`
    UPDATE "ChannelMessage"
    SET "hiddenAt" = NULL, "hiddenById" = NULL
    WHERE "id" = ${messageId};
  `;
  return NextResponse.json({ message: { id: messageId, hiddenAt: null } });
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: { messageId: string } | Promise<{ messageId: string }> }
) {
  let viewer;
  try {
    viewer = await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

  await ensureChannelMessageTable();
  await ensureChannelMessageArchiveTable();

  const { messageId } = await params;
  if (!messageId) {
    return jsonError("INVALID_MESSAGE", 400);
  }

  const existing = await getArchiveMessageRow(messageId);
  if (!existing) {
    return jsonError("NOT_FOUND", 404);
  }
  if (existing.deletedAt) {
    return jsonError("MESSAGE_DELETED", 409);
  }

  const createdAt = toDate(existing.createdAt) ?? new Date();
  const deletedAt = new Date();
  const authorLabel = resolveUserLabel(existing);
  const adminLabel = resolveUserLabel(viewer);

  const hiddenAt = toDate(existing.hiddenAt);
  const archiveId = randomUUID();
  const archiveCreate = prisma.contentArchive.create({
    data: {
      id: archiveId,
      targetType: "channel-message",
      targetId: existing.id,
      authorLabel,
      reporterLabel: "SYSTEM",
      adminLabel,
      createdAt,
      deletedAt,
      expiresAt: new Date(deletedAt.getTime() + ARCHIVE_WINDOW_MS),
    },
  });
  const archiveInsert = prisma.$executeRaw`
    INSERT INTO "ChannelMessageArchive" (
      "archiveId",
      "messageId",
      "channelId",
      "authorId",
      "authorName",
      "text",
      "createdAt",
      "hiddenAt",
      "hiddenById"
    )
    VALUES (
      ${archiveId},
      ${existing.id},
      ${existing.channelId},
      ${existing.authorId},
      ${existing.authorName},
      ${existing.text},
      ${createdAt},
      ${hiddenAt},
      ${existing.hiddenById}
    );
  `;
  const messageDelete = prisma.channelMessage.delete({
    where: { id: existing.id },
  });

  await prisma.$transaction([archiveCreate, archiveInsert, messageDelete]);

  return NextResponse.json({ ok: true });
}
