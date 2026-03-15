import { NextRequest } from "next/server";

import { CHANNELS } from "@/const/channels";
import { auth } from "@/lib/auth";
import { isSqliteProvider } from "@/lib/dbProvider";
import prisma from "@/lib/prisma";

const CREATE_GALLERY_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS "GalleryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "GalleryItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "GalleryLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryLike_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "GalleryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GalleryLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "GalleryComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "GalleryComment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "GalleryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GalleryComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "GalleryCommentLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "GalleryComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GalleryCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GalleryLike_itemId_userId_key" ON "GalleryLike"("itemId", "userId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GalleryCommentLike_commentId_userId_key" ON "GalleryCommentLike"("commentId", "userId");`,
  `CREATE INDEX IF NOT EXISTS "GalleryItem_category_createdAt_idx" ON "GalleryItem"("category", "createdAt");`,
  `CREATE INDEX IF NOT EXISTS "GalleryItem_authorId_createdAt_idx" ON "GalleryItem"("authorId", "createdAt");`,
  `CREATE INDEX IF NOT EXISTS "GalleryComment_itemId_createdAt_idx" ON "GalleryComment"("itemId", "createdAt");`,
  `CREATE INDEX IF NOT EXISTS "GalleryComment_parentId_createdAt_idx" ON "GalleryComment"("parentId", "createdAt");`,
];

const CATEGORY_LABELS = [
  "Życiówki",
  "Krajobraz",
  ...CHANNELS.filter((channel) => channel.id !== "memy" && channel.id !== "gry").map(
    (channel) => channel.name
  ),
  "Sumowe",
];

const CATEGORY_LOOKUP = new Map(
  CATEGORY_LABELS.map((label) => [label.toLowerCase(), label])
);

type TableColumn = {
  name: string;
};

const TABLE_COLUMNS: Record<
  string,
  Array<{ name: string; definition: string }>
> = {
  GalleryItem: [
    { name: "id", definition: "TEXT" },
    { name: "title", definition: "TEXT" },
    { name: "description", definition: "TEXT" },
    { name: "imageUrl", definition: "TEXT" },
    { name: "category", definition: "TEXT" },
    { name: "authorId", definition: "INTEGER" },
    { name: "createdAt", definition: "DATETIME" },
    { name: "updatedAt", definition: "DATETIME" },
    { name: "deletedAt", definition: "DATETIME" },
  ],
  GalleryLike: [
    { name: "id", definition: "TEXT" },
    { name: "itemId", definition: "TEXT" },
    { name: "userId", definition: "INTEGER" },
    { name: "createdAt", definition: "DATETIME" },
  ],
  GalleryComment: [
    { name: "id", definition: "TEXT" },
    { name: "itemId", definition: "TEXT" },
    { name: "authorId", definition: "INTEGER" },
    { name: "parentId", definition: "TEXT" },
    { name: "content", definition: "TEXT" },
    { name: "createdAt", definition: "DATETIME" },
    { name: "deletedAt", definition: "DATETIME" },
  ],
  GalleryCommentLike: [
    { name: "id", definition: "TEXT" },
    { name: "commentId", definition: "TEXT" },
    { name: "userId", definition: "INTEGER" },
    { name: "createdAt", definition: "DATETIME" },
  ],
};

type AuthorShape = {
  username?: string | null;
  nick?: string | null;
  name?: string | null;
};

async function listTableColumns(table: string) {
  return prisma.$queryRawUnsafe<TableColumn[]>(
    `PRAGMA table_info('${table}');`
  );
}

async function addMissingColumns(table: string) {
  const expected = TABLE_COLUMNS[table];
  if (!expected) return;

  let columns: TableColumn[] = [];
  try {
    columns = await listTableColumns(table);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to read columns for ${table}`, error);
    return;
  }

  const existing = new Set(columns.map((column) => column.name));

  for (const column of expected) {
    if (existing.has(column.name)) continue;
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "${table}" ADD COLUMN "${column.name}" ${column.definition};`
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to add ${table}.${column.name}`, error);
    }
  }
}

async function ensureGalleryColumns() {
  for (const table of Object.keys(TABLE_COLUMNS)) {
    await addMissingColumns(table);
  }
}

export async function ensureGalleryTables() {
  if (!isSqliteProvider()) return;
  try {
    for (const statement of CREATE_GALLERY_TABLES_SQL) {
      await prisma.$executeRawUnsafe(statement);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure gallery tables", error);
    return;
  }

  try {
    await ensureGalleryColumns();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure gallery columns", error);
  }
}

export async function resolveSessionUserId(req: NextRequest) {
  try {
    const session = await auth.api
      .getSession({ headers: req.headers })
      .catch(() => null);
    const parsed = Number(session?.user?.id ?? "");
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function resolveAuthorName(author: AuthorShape, fallback?: string | null) {
  return author.username || author.nick || author.name || fallback || "Gość";
}

export function normalizeCategory(raw: string | null) {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  return CATEGORY_LOOKUP.get(normalized) ?? null;
}
