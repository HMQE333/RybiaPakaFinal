import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getVoivodeshipLabel } from "@/const";
import { ensureGalleryTables, resolveAuthorName } from "@/app/api/galeria/_utils";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 120;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

function clampLimit(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(value)));
}

function normalizeQuery(value: string | null) {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
}

function resolveUserLabel(user?: {
  username?: string | null;
  nick?: string | null;
  name?: string | null;
}) {
  return user?.username || user?.nick || user?.name || "Uzytkownik";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = normalizeQuery(searchParams.get("q"));
  const regionId = searchParams.get("region")?.trim() || "";
  const methodId = searchParams.get("method")?.trim() || "";
  const limit = clampLimit(Number(searchParams.get("limit") ?? DEFAULT_LIMIT));

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({
      query,
      users: [],
      threads: [],
      gallery: [],
    });
  }

  const userWhere: Prisma.UserWhereInput = {
    OR: [
      { username: { contains: query } },
      { nick: { contains: query } },
      { name: { contains: query } },
    ],
  };
  if (regionId) {
    userWhere.regionId = regionId;
  }
  if (methodId) {
    userWhere.methods = { some: { methodId } };
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      username: true,
      nick: true,
      name: true,
      avatarUrl: true,
      region: { select: { name: true } },
      methods: { select: { method: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const threadWhere: Prisma.ThreadWhereInput = {
    deletedAt: null,
    OR: [
      { title: { contains: query } },
      { content: { contains: query } },
    ],
  };

  if (regionId || methodId) {
    threadWhere.author = {
      ...(regionId ? { regionId } : {}),
      ...(methodId ? { methods: { some: { methodId } } } : {}),
    };
  }

  const threads = await prisma.thread.findMany({
    where: threadWhere,
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      board: { select: { name: true } },
      author: { select: { username: true, nick: true, name: true, avatarUrl: true } },
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  await ensureGalleryTables();

  const likeValue = `%${query.toLowerCase()}%`;
  const galleryFilters = [
    Prisma.sql`gi."deletedAt" IS NULL`,
    Prisma.sql`(lower(gi."title") LIKE ${likeValue} OR lower(COALESCE(gi."description", "")) LIKE ${likeValue})`,
  ];

  if (regionId) {
    galleryFilters.push(Prisma.sql`u."regionId" = ${regionId}`);
  }

  if (methodId) {
    galleryFilters.push(
      Prisma.sql`EXISTS (SELECT 1 FROM "UserFishingMethod" ufm WHERE ufm."userId" = u."id" AND ufm."methodId" = ${methodId})`
    );
  }

  const galleryRows = (await prisma.$queryRaw(
    Prisma.sql`
      SELECT
        gi."id"          AS "id",
        gi."title"       AS "title",
        gi."description" AS "description",
        gi."imageUrl"    AS "imageUrl",
        gi."category"    AS "category",
        gi."createdAt"   AS "createdAt",
        u."username"     AS "username",
        u."nick"         AS "nick",
        u."name"         AS "name",
        u."avatarUrl"    AS "avatarUrl"
      FROM "GalleryItem" gi
      JOIN "User" u ON u."id" = gi."authorId"
      WHERE ${Prisma.join(galleryFilters, " AND ")}
      ORDER BY gi."createdAt" DESC
      LIMIT ${limit};
    `
  )) as Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    category: string;
    createdAt: string | Date;
    username: string | null;
    nick: string | null;
    name: string | null;
    avatarUrl: string | null;
  }>;

  return NextResponse.json({
    query,
    users: users.map((user) => ({
      id: user.id,
      handle: resolveUserLabel(user),
      avatarUrl: user.avatarUrl,
      region: getVoivodeshipLabel(user.region?.name ?? null),
      methods: user.methods.map((method) => method.method.name),
    })),
    threads: threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      excerpt: thread.content,
      createdAt: thread.createdAt,
      board: thread.board?.name ?? null,
      comments: thread._count.posts,
      author: {
        name: resolveUserLabel(thread.author ?? undefined),
        avatarUrl: thread.author?.avatarUrl ?? null,
      },
    })),
    gallery: galleryRows.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      category: item.category,
      createdAt: item.createdAt,
      author: {
        name: resolveAuthorName({
          username: item.username,
          nick: item.nick,
          name: item.name,
        }),
        avatarUrl: item.avatarUrl,
      },
    })),
  });
}
