import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getViewerFromHeaders, isAdminRole } from "@/lib/adminAccess";
import { saveGalleryImage } from "@/lib/localUpload";
import prisma from "@/lib/prisma";

import {
  ensureGalleryTables,
  normalizeCategory,
  resolveAuthorName,
  resolveSessionUserId,
} from "../_utils";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_ITEMS_LIMIT = 120;

function isGifUrl(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return false;
  const noHash = trimmed.split("#")[0];
  const noQuery = noHash.split("?")[0];
  return noQuery.endsWith(".gif");
}


function coerceLimit(raw: string | null) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 40;
  return Math.min(Math.floor(parsed), MAX_ITEMS_LIMIT);
}

function coerceOffset(raw: string | null) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

export async function GET(req: NextRequest) {
  await ensureGalleryTables();

  const viewer = await getViewerFromHeaders(req.headers);
  const viewerId = viewer?.id ?? null;
  const viewerJoinId = viewerId ?? -1;
  const isAdmin = viewer ? isAdminRole(viewer.role) : false;
  const search = req.nextUrl.searchParams;
  const category = normalizeCategory(search.get("category"));
  const author = (search.get("autor") ?? search.get("author") ?? "").trim();
  const limit = coerceLimit(search.get("limit"));
  const offset = coerceOffset(search.get("offset"));

  const filters: Prisma.Sql[] = [Prisma.sql`gi."deletedAt" IS NULL`];

  if (category) {
    filters.push(Prisma.sql`gi."category" = ${category}`);
  }

  if (author) {
    filters.push(
      Prisma.sql`(u."username" = ${author} OR u."nick" = ${author} OR u."name" = ${author})`
    );
  }

  const whereClause =
    filters.length > 0 ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}` : Prisma.sql``;

  const runQuery = async () =>
    (await prisma.$queryRaw(
      Prisma.sql`
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
        ${whereClause}
        ORDER BY gi."createdAt" DESC
        LIMIT ${limit} OFFSET ${offset};
      `
    )) as Array<{
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
    }>;

  let rows: Awaited<ReturnType<typeof runQuery>> = [];

  try {
    rows = await runQuery();
  } catch (error) {
    const message = (error as Error)?.message ?? "";
    if (message.includes("no such table") || message.includes("does not exist")) {
      await ensureGalleryTables();
      try {
        rows = await runQuery();
      } catch (retryError) {
        // eslint-disable-next-line no-console
        console.error("Retry failed while loading gallery items", retryError);
        return NextResponse.json({ error: "FAILED_TO_LOAD" }, { status: 500 });
      }
    } else {
      // eslint-disable-next-line no-console
      console.error("Failed to load gallery items", error);
      return NextResponse.json({ error: "FAILED_TO_LOAD" }, { status: 500 });
    }
  }

  const items = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    category: row.category,
    createdAt: new Date(row.createdAt).toISOString(),
    likes: Number(row.likes ?? 0),
    comments: Number(row.comments ?? 0),
    liked: Boolean(row.liked),
    canEdit: Boolean(viewerId) && row.authorId === viewerId,
    canDelete: Boolean(viewerId) && (row.authorId === viewerId || isAdmin),
    author: {
      id: row.authorId,
      name: resolveAuthorName(
        { username: row.username, nick: row.nick, name: row.name },
        null
      ),
      avatar: row.avatarUrl,
    },
  }));

  return NextResponse.json({
    items,
    viewer: { authenticated: Boolean(viewerId) },
  });
}

export async function POST(req: NextRequest) {
  await ensureGalleryTables();

  const userId = await resolveSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let title = "";
  let description = "";
  let category = "";
  let imageUrl = "";
  let uploadedFile: File | null = null;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    title = String(form.get("title") ?? "").trim();
    description = String(form.get("description") ?? "").trim();
    category = String(form.get("category") ?? "").trim();
    imageUrl = String(form.get("imageUrl") ?? "").trim();

    const file = form.get("file");
    if (file && file instanceof File && file.size > 0) {
      uploadedFile = file;
    }
  } else {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    title = String(body?.title ?? "").trim();
    description = String(body?.description ?? "").trim();
    category = String(body?.category ?? "").trim();
    imageUrl = String(body?.imageUrl ?? "").trim();
  }

  if (!title || !category || (!imageUrl && !uploadedFile)) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  if (isGifUrl(imageUrl)) {
    return NextResponse.json({ error: "GIF_NOT_ALLOWED" }, { status: 400 });
  }

  const normalizedCategory = normalizeCategory(category);
  if (!normalizedCategory) {
    return NextResponse.json({ error: "INVALID_CATEGORY" }, { status: 400 });
  }

  const safeTitle = title.slice(0, MAX_TITLE_LENGTH);
  const safeDescription = description ? description.slice(0, MAX_DESCRIPTION_LENGTH) : null;

  try {
    if (uploadedFile) {
      try {
        imageUrl = await saveGalleryImage(uploadedFile);
      } catch (uploadError) {
        const msg = (uploadError as Error)?.message ?? "";
        if (msg === "UNSUPPORTED_FILE_TYPE") {
          return NextResponse.json({ error: "UNSUPPORTED_FILE_TYPE" }, { status: 400 });
        }
        if (msg === "FILE_TOO_LARGE") {
          return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
        }
        return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 502 });
      }
    }

    const created = await prisma.galleryItem.create({
      data: {
        title: safeTitle,
        description: safeDescription,
        imageUrl,
        category: normalizedCategory,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, username: true, nick: true, name: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(
      {
        item: {
          id: created.id,
          title: created.title,
          description: created.description,
          imageUrl: created.imageUrl,
          category: created.category,
          createdAt: created.createdAt.toISOString(),
          likes: 0,
          comments: 0,
          liked: false,
          canEdit: true,
          canDelete: true,
          author: {
            id: created.author.id,
            name: resolveAuthorName(created.author, null),
            avatar: created.author.avatarUrl ?? null,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create gallery item", error);
    return NextResponse.json({ error: "FAILED_TO_CREATE" }, { status: 500 });
  }
}
