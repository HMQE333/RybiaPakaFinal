import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

import { ensureGalleryTables, resolveSessionUserId } from "../../../_utils";

type RouteParams = {
  itemId: string;
};

type RouteContext = {
  params: RouteParams | Promise<RouteParams>;
};

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

  const exists = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "GalleryItem"
    WHERE "id" = ${itemId} AND "deletedAt" IS NULL
    LIMIT 1;
  `;

  if (!exists.length) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "GalleryLike"
    WHERE "itemId" = ${itemId} AND "userId" = ${userId}
    LIMIT 1;
  `;

  let liked = false;

  if (existing.length) {
    await prisma.$executeRaw`
      DELETE FROM "GalleryLike"
      WHERE "itemId" = ${itemId} AND "userId" = ${userId};
    `;
    liked = false;
  } else {
    const likeId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "GalleryLike" ("id", "itemId", "userId")
      VALUES (${likeId}, ${itemId}, ${userId});
    `;
    liked = true;
  }

  const countRows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*) as count FROM "GalleryLike" WHERE "itemId" = ${itemId};
  `;
  const likes = Number(countRows[0]?.count ?? 0);

  return NextResponse.json({ liked, likes });
}
