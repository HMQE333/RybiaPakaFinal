import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { getViewerFromHeaders, isAdminRole } from "@/lib/adminAccess";
import prisma from "@/lib/prisma";

import {
  ensureGalleryTables,
  resolveAuthorName,
  resolveSessionUserId,
} from "../../../_utils";

const MAX_COMMENT_LENGTH = 800;

type RouteParams = {
  itemId: string;
};

type RouteContext = {
  params: RouteParams | Promise<RouteParams>;
};

type CommentRow = {
  id: string;
  content: string;
  createdAt: string | Date | null;
  parentId: string | null;
  authorId: number;
  username?: string | null;
  nick?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  likes: number | null;
  liked: number | null;
};

const isMissingTableError = (error: unknown) => {
  const message = ((error as Error)?.message ?? "").toLowerCase();
  return (
    message.includes("no such table") ||
    message.includes("does not exist") ||
    message.includes("no such column")
  );
};

const toIsoString = (value: string | Date | null | undefined) => {
  const parsed = value instanceof Date ? value : new Date(value ?? 0);
  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString()
    : new Date(0).toISOString();
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  await ensureGalleryTables();

  const { itemId } = await params;
  if (!itemId) {
    return NextResponse.json({ error: "INVALID_ITEM" }, { status: 400 });
  }

  const viewer = await getViewerFromHeaders(req.headers);
  const viewerId = viewer?.id ?? null;
  const viewerJoinId = viewerId ?? -1;
  const viewerIsAdmin = viewer ? isAdminRole(viewer.role) : false;

  const loadExists = async () =>
    prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "GalleryItem"
      WHERE "id" = ${itemId} AND "deletedAt" IS NULL
      LIMIT 1;
    `;

  let exists: Array<{ id: string }> = [];

  try {
    exists = await loadExists();
  } catch (error) {
    if (isMissingTableError(error)) {
      await ensureGalleryTables();
      try {
        exists = await loadExists();
      } catch (retryError) {
        // eslint-disable-next-line no-console
        console.error("Retry failed while loading gallery item comments", retryError);
        return NextResponse.json({ error: "FAILED_TO_LOAD" }, { status: 500 });
      }
    } else {
      // eslint-disable-next-line no-console
      console.error("Failed to load gallery item comments", error);
      return NextResponse.json({ error: "FAILED_TO_LOAD" }, { status: 500 });
    }
  }

  if (!exists.length) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const loadRowsWithLikes = async () =>
    prisma.$queryRaw<CommentRow[]>`
      SELECT
        gc."id"        AS "id",
        gc."content"   AS "content",
        gc."createdAt" AS "createdAt",
        gc."parentId"  AS "parentId",
        u."id"                                  AS "authorId",
        u."username"                            AS "username",
        u."nick"                                AS "nick",
        u."name"                                AS "name",
        COALESCE(u."avatarUrl", u."image")      AS "avatarUrl",
        COALESCE(l."likeCount", 0)              AS "likes",
        CASE WHEN ul."userId" IS NULL THEN 0 ELSE 1 END    AS "liked"
      FROM "GalleryComment" gc
      LEFT JOIN "User" u ON u."id" = gc."authorId"
      LEFT JOIN (
        SELECT "commentId", COUNT(*) as "likeCount"
        FROM "GalleryCommentLike"
        GROUP BY "commentId"
      ) l ON l."commentId" = gc."id"
      LEFT JOIN "GalleryCommentLike" ul
        ON ul."commentId" = gc."id" AND ul."userId" = ${viewerJoinId}
      WHERE gc."itemId" = ${itemId} AND gc."deletedAt" IS NULL
      ORDER BY gc."createdAt" ASC;
    `;

  const loadRowsWithoutLikes = async () =>
    prisma.$queryRaw<CommentRow[]>`
      SELECT
        gc."id"        AS "id",
        gc."content"   AS "content",
        gc."createdAt" AS "createdAt",
        gc."parentId"  AS "parentId",
        u."id"                                  AS "authorId",
        u."username"                            AS "username",
        u."nick"                                AS "nick",
        u."name"                                AS "name",
        COALESCE(u."avatarUrl", u."image")      AS "avatarUrl",
        0 AS "likes",
        0 AS "liked"
      FROM "GalleryComment" gc
      LEFT JOIN "User" u ON u."id" = gc."authorId"
      WHERE gc."itemId" = ${itemId} AND gc."deletedAt" IS NULL
      ORDER BY gc."createdAt" ASC;
    `;

  const loadRowsMinimalWithTimestamp = async () =>
    prisma.$queryRaw<CommentRow[]>`
      SELECT
        gc."id"        AS "id",
        gc."content"   AS "content",
        gc."createdAt" AS "createdAt",
        NULL           AS "parentId",
        0              AS "authorId",
        0              AS "likes",
        0              AS "liked"
      FROM "GalleryComment" gc
      WHERE gc."itemId" = ${itemId} AND gc."deletedAt" IS NULL
      ORDER BY gc."createdAt" ASC;
    `;

  const loadRowsMinimal = async () =>
    prisma.$queryRaw<CommentRow[]>`
      SELECT
        gc."id"      AS "id",
        gc."content" AS "content",
        NULL         AS "createdAt",
        NULL         AS "parentId",
        0            AS "authorId",
        0            AS "likes",
        0            AS "liked"
      FROM "GalleryComment" gc
      WHERE gc."itemId" = ${itemId} AND gc."deletedAt" IS NULL
      ORDER BY gc."rowid" ASC;
    `;

  const attemptLoad = async (loader: () => Promise<CommentRow[]>) => {
    try {
      return await loader();
    } catch (error) {
      if (isMissingTableError(error)) {
        await ensureGalleryTables();
        return await loader();
      }
      throw error;
    }
  };

  const loaders = [
    { label: "with likes", loader: loadRowsWithLikes },
    { label: "without likes", loader: loadRowsWithoutLikes },
    { label: "minimal with timestamp", loader: loadRowsMinimalWithTimestamp },
    { label: "minimal", loader: loadRowsMinimal },
  ];

  let rows: CommentRow[] | null = null;

  for (const { label, loader } of loaders) {
    try {
      rows = await attemptLoad(loader);
      break;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load gallery comments (${label})`, error);
    }
  }

  if (!rows) {
    return NextResponse.json({ error: "FAILED_TO_LOAD" }, { status: 500 });
  }

  const comments = rows.map((row) => {
    const authorId = Number(row.authorId ?? 0);

    return {
      id: row.id,
      content: row.content,
      createdAt: toIsoString(row.createdAt),
      parentId: row.parentId ?? null,
      likes: Number(row.likes ?? 0),
      liked: Boolean(row.liked),
      canDelete:
        Boolean(viewerId) &&
        (viewerIsAdmin ||
          (Number.isFinite(authorId) ? authorId : 0) === viewerId),
      author: {
        id: Number.isFinite(authorId) ? authorId : 0,
        name: resolveAuthorName(
          {
            username: row.username ?? null,
            nick: row.nick ?? null,
            name: row.name ?? null,
          },
          null
        ),
        avatar: row.avatarUrl ?? null,
      },
    };
  });

  return NextResponse.json({
    comments,
    viewer: { authenticated: Boolean(viewerId) },
  });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  await ensureGalleryTables();

  const { itemId } = await params;
  if (!itemId) {
    return NextResponse.json({ error: "INVALID_ITEM" }, { status: 400 });
  }

  const userId = await resolveSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const content = String(body?.content ?? "").trim();
  const parentId = body?.parentId ? String(body.parentId) : null;

  if (!content) {
    return NextResponse.json({ error: "EMPTY_COMMENT" }, { status: 400 });
  }

  const safeContent =
    content.length > MAX_COMMENT_LENGTH
      ? content.slice(0, MAX_COMMENT_LENGTH)
      : content;

  const exists = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "GalleryItem"
    WHERE "id" = ${itemId} AND "deletedAt" IS NULL
    LIMIT 1;
  `;

  if (!exists.length) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (parentId) {
    const parent = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "GalleryComment"
      WHERE "id" = ${parentId} AND "itemId" = ${itemId} AND "deletedAt" IS NULL
      LIMIT 1;
    `;
    if (!parent.length) {
      return NextResponse.json({ error: "INVALID_PARENT" }, { status: 400 });
    }
  }

  const id = randomUUID();

  try {
    await prisma.$executeRaw`
      INSERT INTO "GalleryComment" ("id", "itemId", "authorId", "parentId", "content")
      VALUES (${id}, ${itemId}, ${userId}, ${parentId}, ${safeContent});
    `;

    const author = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, nick: true, name: true, avatarUrl: true, image: true },
    });

    const createdRow = await prisma.$queryRaw<
      Array<{ createdAt: string | Date }>
    >`SELECT "createdAt" FROM "GalleryComment" WHERE "id" = ${id} LIMIT 1;`;

    const createdAt = createdRow[0]?.createdAt
      ? new Date(createdRow[0].createdAt).toISOString()
      : new Date().toISOString();

    return NextResponse.json(
      {
        comment: {
          id,
          content: safeContent,
          createdAt,
          parentId,
          likes: 0,
          liked: false,
          canDelete: true,
          author: {
            id: author?.id ?? userId,
            name: resolveAuthorName(author ?? {}, null),
            avatar: author?.avatarUrl || author?.image || null,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to add gallery comment", error);
    return NextResponse.json({ error: "FAILED_TO_CREATE" }, { status: 500 });
  }
}
