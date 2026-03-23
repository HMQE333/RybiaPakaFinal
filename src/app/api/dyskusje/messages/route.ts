import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { CHANNELS } from "@/const/channels";
import { getSessionSafe } from "@/lib/auth";
import { isAdminRole } from "@/lib/adminAccess";
import prisma from "@/lib/prisma";
import { ensureChannelMessageTable } from "./_utils";

const CHANNEL_IDS = new Set(CHANNELS.map((channel) => channel.id));
const MAX_MESSAGE_LENGTH = 1_000;

type AuthorShape = {
  id: number | null;
  username: string | null;
  nick: string | null;
  name: string | null;
  avatarUrl: string | null;
  image?: string | null;
  role: string | null;
};

type ChannelMessageRow = {
  id: string;
  channelId: string;
  text: string;
  createdAt: string | Date;
  authorName: string | null;
  hiddenAt: string | Date | null;
  hiddenById: number | null;
  authorId: number | null;
  username: string | null;
  nick: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: string | null;
};

type CreatedMessage = {
  id: string;
  channelId: string;
  text: string;
  createdAt: Date;
  authorName: string | null;
  author?: AuthorShape | null;
};

async function resolveSessionViewer(req: NextRequest) {
  try {
    const session = await getSessionSafe(req.headers);
    const parsed = Number(session?.user?.id ?? "");
    if (Number.isInteger(parsed) && parsed > 0) {
      const viewer = await prisma.user.findUnique({
        where: { id: parsed },
        select: { id: true, role: true, username: true, nick: true, name: true },
      });
      if (viewer) {
        return viewer;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function resolveViewerDisplayName(viewer: {
  username?: string | null;
  nick?: string | null;
  name?: string | null;
}) {
  return viewer.username || viewer.nick || viewer.name || null;
}

function isAdminChannel(channelId: string) {
  return Boolean(
    CHANNELS.find((channel) => channel.id === channelId)?.adminOnly
  );
}

function resolveChannel(raw: string | null) {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  return CHANNEL_IDS.has(value) ? value : null;
}

function resolveAuthorName(author: AuthorShape, authorName?: string | null) {
  return author.username || author.nick || author.name || authorName || "Gość";
}

const toIso = (value: string | Date | null) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString();
};

function serializeMessage(message: ChannelMessageRow) {
  const author: AuthorShape = {
    id: message.authorId,
    username: message.username,
    nick: message.nick,
    name: message.name,
    avatarUrl: message.avatarUrl,
    role: message.role,
  };

  return {
    id: message.id,
    channelId: message.channelId,
    text: message.text,
    createdAt: toIso(message.createdAt),
    hiddenAt: toIso(message.hiddenAt),
    hiddenById: message.hiddenById ?? null,
    author: {
      id: author.id,
      name: resolveAuthorName(author, message.authorName),
      avatar: author.avatarUrl,
      role: author.role,
    },
  };
}

const serializeCreatedMessage = (message: CreatedMessage) =>
  serializeMessage({
    id: message.id,
    channelId: message.channelId,
    text: message.text,
    createdAt: message.createdAt,
    authorName: message.authorName ?? null,
    hiddenAt: null,
    hiddenById: null,
    authorId: message.author?.id ?? null,
    username: message.author?.username ?? null,
    nick: message.author?.nick ?? null,
    name: message.author?.name ?? null,
    avatarUrl: message.author?.avatarUrl || message.author?.image || null,
    role: message.author?.role ?? null,
  });

const PAGE_SIZE = 60;
const RETENTION_DAYS = 60;

export async function GET(req: NextRequest) {
  const viewer = await resolveSessionViewer(req);
  const viewerId = viewer?.id ?? null;
  const search = req.nextUrl.searchParams;
  const channelId = resolveChannel(search.get("kanal") ?? search.get("channel"));

  if (!channelId) {
    return NextResponse.json({ error: "INVALID_CHANNEL" }, { status: 400 });
  }

  if (isAdminChannel(channelId)) {
    if (!viewerId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (!isAdminRole(viewer?.role ?? null)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  await ensureChannelMessageTable();

  const beforeRaw = search.get("before");
  const beforeDate = beforeRaw ? new Date(beforeRaw) : null;
  const validBefore = beforeDate && Number.isFinite(beforeDate.getTime()) ? beforeDate : null;

  const retentionCutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const beforeClause = validBefore
    ? Prisma.sql`AND cm."createdAt" < ${validBefore}`
    : Prisma.sql``;

  const fetchLimit = PAGE_SIZE + 1;

  const rows = await prisma.$queryRaw<ChannelMessageRow[]>(
    Prisma.sql`
      SELECT
        cm."id"          AS "id",
        cm."channelId"   AS "channelId",
        cm."text"        AS "text",
        cm."createdAt"   AS "createdAt",
        cm."authorName"  AS "authorName",
        cm."hiddenAt"    AS "hiddenAt",
        cm."hiddenById"  AS "hiddenById",
        cm."authorId"    AS "authorId",
        u."username"                           AS "username",
        u."nick"                               AS "nick",
        u."name"                               AS "name",
        COALESCE(u."avatarUrl", u."image")     AS "avatarUrl",
        u."role"                               AS "role"
      FROM "ChannelMessage" cm
      LEFT JOIN "User" u ON u."id" = cm."authorId"
      WHERE cm."channelId" = ${channelId}
        AND cm."deletedAt" IS NULL
        AND cm."createdAt" > ${retentionCutoff}
        ${beforeClause}
      ORDER BY cm."createdAt" DESC
      LIMIT ${fetchLimit};
    `
  );

  const hasOlder = rows.length > PAGE_SIZE;
  const page = hasOlder ? rows.slice(0, PAGE_SIZE) : rows;
  page.reverse();

  return NextResponse.json({
    messages: page.map((message) => serializeMessage(message)),
    hasOlder,
    viewer: { authenticated: Boolean(viewerId), role: viewer?.role ?? null },
  });
}

export async function POST(req: NextRequest) {
  await ensureChannelMessageTable();

  const viewer = await resolveSessionViewer(req);
  if (!viewer) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const channelId = resolveChannel(
    body?.kanal ?? body?.channel ?? body?.channelId ?? null
  );
  const text = String(body?.text ?? body?.message ?? "").trim();
  if (!channelId) {
    return NextResponse.json({ error: "INVALID_CHANNEL" }, { status: 400 });
  }
  if (isAdminChannel(channelId) && !isAdminRole(viewer.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (!text) {
    return NextResponse.json({ error: "EMPTY_MESSAGE" }, { status: 400 });
  }

  const safeText =
    text.length > MAX_MESSAGE_LENGTH
      ? text.slice(0, MAX_MESSAGE_LENGTH)
      : text;

  try {
    const message = await prisma.channelMessage.create({
      data: {
        channelId,
        text: safeText,
        authorId: viewer.id,
        authorName: resolveViewerDisplayName(viewer),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nick: true,
            name: true,
            avatarUrl: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ message: serializeCreatedMessage(message) }, { status: 201 });
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? "";
    if (errorMessage.includes("no such table") || errorMessage.includes("does not exist")) {
      await ensureChannelMessageTable();
      try {
        const retry = await prisma.channelMessage.create({
          data: {
            channelId,
            text: safeText,
            authorId: viewer.id,
            authorName: resolveViewerDisplayName(viewer),
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                nick: true,
                name: true,
                avatarUrl: true,
                image: true,
                role: true,
              },
            },
          },
        });

        return NextResponse.json({ message: serializeCreatedMessage(retry) }, { status: 201 });
      } catch (retryError) {
        // eslint-disable-next-line no-console
        console.error("Retry failed after ensuring table", retryError);
      }
    }

    // eslint-disable-next-line no-console
    console.error("Failed to save channel message", error);
    return NextResponse.json({ error: "FAILED_TO_SAVE" }, { status: 500 });
  }
}




