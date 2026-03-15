import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getViewerFromHeaders, isAdminRole } from "@/lib/adminAccess";
import prisma from "@/lib/prisma";
import {
  ensureGalleryTables,
  normalizeCategory,
  resolveAuthorName,
} from "../../_utils";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

export const dynamic = "force-dynamic";

const isGifUrl = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return false;
  const noHash = trimmed.split("#")[0];
  const noQuery = noHash.split("?")[0];
  return noQuery.endsWith(".gif");
};

async function loadItemMeta(itemId: string) {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    authorId: number;
    deletedAt: string | Date | null;
  }>>`
    SELECT "id", "authorId", "deletedAt"
    FROM "GalleryItem"
    WHERE "id" = ${itemId}
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

async function loadItemPayload(itemId: string, viewerId: number | null) {
  const viewerJoinId = viewerId ?? -1;
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    category: string;
    createdAt: string | Date;
    authorId: number;
    username: string | null;
    nick: string | null;
    name: string | null;
    avatarUrl: string | null;
    likes: number;
    comments: number;
    liked: number;
  }>>`
    SELECT
      gi."id" as id,
      gi."title" as title,
      gi."description" as description,
      gi."imageUrl" as imageUrl,
      gi."category" as category,
      gi."createdAt" as createdAt,
      u."id" as authorId,
      u."username" as username,
      u."nick" as nick,
      u."name" as name,
      u."avatarUrl" as avatarUrl,
      COALESCE(l."likeCount", 0) as likes,
      COALESCE(c."commentCount", 0) as comments,
      CASE WHEN ul."userId" IS NULL THEN 0 ELSE 1 END as liked
    FROM "GalleryItem" gi
    JOIN "User" u ON u."id" = gi."authorId"
    LEFT JOIN (
      SELECT "itemId", COUNT(*) as "likeCount"
      FROM "GalleryLike"
      GROUP BY "itemId"
    ) l ON l."itemId" = gi."id"
    LEFT JOIN (
      SELECT "itemId", COUNT(*) as "commentCount"
      FROM "GalleryComment"
      WHERE "deletedAt" IS NULL
      GROUP BY "itemId"
    ) c ON c."itemId" = gi."id"
    LEFT JOIN "GalleryLike" ul
      ON ul."itemId" = gi."id" AND ul."userId" = ${viewerJoinId}
    WHERE gi."id" = ${itemId} AND gi."deletedAt" IS NULL
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } | Promise<{ itemId: string }> }
) {
  await ensureGalleryTables();

  const { itemId } = await params;
  if (!itemId) {
    return NextResponse.json({ error: "INVALID_ITEM" }, { status: 400 });
  }

  const viewer = await getViewerFromHeaders(req.headers);
  if (!viewer) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const item = await loadItemMeta(itemId);
  if (!item || item.deletedAt) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isAdmin = isAdminRole(viewer.role);
  if (item.authorId !== viewer.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const updates: Prisma.Sql[] = [];

  if (body?.title !== undefined) {
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "INVALID_TITLE" }, { status: 400 });
    }
    updates.push(
      Prisma.sql`"title" = ${title.slice(0, MAX_TITLE_LENGTH)}`
    );
  }

  if (body?.description !== undefined) {
    const description = String(body.description ?? "").trim();
    const safeDescription = description
      ? description.slice(0, MAX_DESCRIPTION_LENGTH)
      : null;
    updates.push(Prisma.sql`"description" = ${safeDescription}`);
  }

  if (body?.category !== undefined) {
    const normalized = normalizeCategory(String(body.category ?? ""));
    if (!normalized) {
      return NextResponse.json({ error: "INVALID_CATEGORY" }, { status: 400 });
    }
    updates.push(Prisma.sql`"category" = ${normalized}`);
  }

  if (body?.imageUrl !== undefined) {
    const imageUrl = String(body.imageUrl ?? "").trim();
    if (!imageUrl) {
      return NextResponse.json({ error: "INVALID_IMAGE" }, { status: 400 });
    }
    if (isGifUrl(imageUrl)) {
      return NextResponse.json({ error: "GIF_NOT_ALLOWED" }, { status: 400 });
    }
    updates.push(Prisma.sql`"imageUrl" = ${imageUrl}`);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "NO_CHANGES" }, { status: 400 });
  }

  updates.push(Prisma.sql`"updatedAt" = ${new Date()}`);

  const sql = Prisma.sql`UPDATE "GalleryItem" SET ${Prisma.join(
    updates,
    ", "
  )} WHERE "id" = ${itemId};`;

  try {
    await prisma.$executeRaw(sql);
    const updated = await loadItemPayload(itemId, viewer.id);
    if (!updated) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const canEdit = updated.authorId === viewer.id;
    const canDelete = updated.authorId === viewer.id || isAdmin;

    return NextResponse.json({
      item: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        imageUrl: updated.imageUrl,
        category: updated.category,
        createdAt: new Date(updated.createdAt).toISOString(),
        likes: Number(updated.likes ?? 0),
        comments: Number(updated.comments ?? 0),
        liked: Boolean(updated.liked),
        canEdit,
        canDelete,
        author: {
          id: updated.authorId,
          name: resolveAuthorName(
            {
              username: updated.username,
              nick: updated.nick,
              name: updated.name,
            },
            null
          ),
          avatar: updated.avatarUrl,
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to update gallery item", error);
    return NextResponse.json({ error: "FAILED_TO_UPDATE" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } | Promise<{ itemId: string }> }
) {
  await ensureGalleryTables();

  const { itemId } = await params;
  if (!itemId) {
    return NextResponse.json({ error: "INVALID_ITEM" }, { status: 400 });
  }

  const viewer = await getViewerFromHeaders(req.headers);
  if (!viewer) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const item = await loadItemMeta(itemId);
  if (!item || item.deletedAt) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isAdmin = isAdminRole(viewer.role);
  if (item.authorId !== viewer.id && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const deletedAt = new Date();
    await prisma.$executeRaw`
      UPDATE "GalleryItem" SET "deletedAt" = ${deletedAt}
      WHERE "id" = ${itemId};
    `;
    await prisma.$executeRaw`
      UPDATE "GalleryComment" SET "deletedAt" = ${deletedAt}
      WHERE "itemId" = ${itemId};
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete gallery item", error);
    return NextResponse.json({ error: "FAILED_TO_DELETE" }, { status: 500 });
  }
}
