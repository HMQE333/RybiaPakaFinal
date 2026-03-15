import { isSqliteProvider } from "@/lib/dbProvider";
import prisma from "@/lib/prisma";

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "ChannelMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "channelId" TEXT NOT NULL,
  "authorId" INTEGER,
  "authorName" TEXT,
  "text" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "hiddenAt" DATETIME,
  "hiddenById" INTEGER,
  "deletedAt" DATETIME,
  "deletedById" INTEGER,
  CONSTRAINT "ChannelMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ChannelMessage_channelId_createdAt_idx" ON "ChannelMessage"("channelId", "createdAt");
CREATE INDEX IF NOT EXISTS "ChannelMessage_authorId_createdAt_idx" ON "ChannelMessage"("authorId", "createdAt");
`;

const CREATE_ARCHIVE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "ChannelMessageArchive" (
  "archiveId" TEXT NOT NULL PRIMARY KEY,
  "messageId" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "authorId" INTEGER,
  "authorName" TEXT,
  "text" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL,
  "hiddenAt" DATETIME,
  "hiddenById" INTEGER
);
CREATE INDEX IF NOT EXISTS "ChannelMessageArchive_messageId_idx" ON "ChannelMessageArchive"("messageId");
`;

type TableColumn = {
  name: string;
};

const EXTRA_COLUMNS = [
  { name: "hiddenAt", definition: "DATETIME" },
  { name: "hiddenById", definition: "INTEGER" },
  { name: "deletedAt", definition: "DATETIME" },
  { name: "deletedById", definition: "INTEGER" },
];

async function listTableColumns() {
  return prisma.$queryRawUnsafe<TableColumn[]>(
    `PRAGMA table_info('ChannelMessage');`
  );
}

async function ensureChannelMessageColumns() {
  let columns: TableColumn[] = [];
  try {
    columns = await listTableColumns();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to read ChannelMessage columns", error);
    return;
  }

  const existing = new Set(columns.map((column) => column.name));
  for (const column of EXTRA_COLUMNS) {
    if (existing.has(column.name)) continue;
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "ChannelMessage" ADD COLUMN "${column.name}" ${column.definition};`
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to add ChannelMessage.${column.name}`, error);
    }
  }
}

export async function ensureChannelMessageTable() {
  if (!isSqliteProvider()) return;
  try {
    await prisma.$executeRawUnsafe(CREATE_TABLE_SQL);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure ChannelMessage table", error);
    return;
  }

  try {
    await ensureChannelMessageColumns();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure ChannelMessage columns", error);
  }
}

export async function ensureChannelMessageArchiveTable() {
  if (!isSqliteProvider()) return;
  try {
    await prisma.$executeRawUnsafe(CREATE_ARCHIVE_TABLE_SQL);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure ChannelMessageArchive table", error);
  }
}
