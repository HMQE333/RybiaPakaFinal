import { isSqliteProvider } from "@/lib/dbProvider";
import prisma from "@/lib/prisma";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
  normalizeNotificationSettings,
} from "@/lib/notificationSettings";

const CREATE_NOTIFICATION_SETTINGS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "UserNotificationSetting" (
  "userId" INTEGER NOT NULL PRIMARY KEY,
  "commentReply" INTEGER NOT NULL DEFAULT 1,
  "commentMention" INTEGER NOT NULL DEFAULT 1,
  "threadMention" INTEGER NOT NULL DEFAULT 1,
  "galleryMention" INTEGER NOT NULL DEFAULT 1,
  "newMessage" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserNotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`;

type TableColumn = {
  name: string;
};

const TABLE_COLUMNS: Record<
  string,
  Array<{ name: string; definition: string }>
> = {
  UserNotificationSetting: [
    { name: "userId", definition: "INTEGER" },
    { name: "commentReply", definition: "INTEGER NOT NULL DEFAULT 1" },
    { name: "commentMention", definition: "INTEGER NOT NULL DEFAULT 1" },
    { name: "threadMention", definition: "INTEGER NOT NULL DEFAULT 1" },
    { name: "galleryMention", definition: "INTEGER NOT NULL DEFAULT 1" },
    { name: "newMessage", definition: "INTEGER NOT NULL DEFAULT 1" },
    { name: "createdAt", definition: "DATETIME" },
    { name: "updatedAt", definition: "DATETIME" },
  ],
};

type NotificationSettingsRow = {
  userId: number;
  commentReply: number | null;
  commentMention: number | null;
  threadMention: number | null;
  galleryMention: number | null;
  newMessage: number | null;
};

const resolveDbBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "1" || normalized === "true") return true;
    if (normalized === "0" || normalized === "false") return false;
  }
  return undefined;
};

const toDbBoolean = (value: boolean) => (value ? 1 : 0);

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

export async function ensureNotificationSettingsTable() {
  if (!isSqliteProvider()) return;
  try {
    await prisma.$executeRawUnsafe(CREATE_NOTIFICATION_SETTINGS_TABLE_SQL);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure UserNotificationSetting table", error);
    return;
  }

  try {
    await addMissingColumns("UserNotificationSetting");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure notification settings columns", error);
  }
}

function mapRowToSettings(row: NotificationSettingsRow): NotificationSettings {
  return normalizeNotificationSettings({
    commentReply: resolveDbBoolean(row.commentReply),
    commentMention: resolveDbBoolean(row.commentMention),
    threadMention: resolveDbBoolean(row.threadMention),
    galleryMention: resolveDbBoolean(row.galleryMention),
    newMessage: resolveDbBoolean(row.newMessage),
  });
}

async function fetchSettingsRow(userId: number) {
  const rows = await prisma.$queryRaw<NotificationSettingsRow[]>`
    SELECT
      "userId",
      "commentReply",
      "commentMention",
      "threadMention",
      "galleryMention",
      "newMessage"
    FROM "UserNotificationSetting"
    WHERE "userId" = ${userId}
    LIMIT 1;
  `;

  return rows[0] ?? null;
}

export async function getNotificationSettings(userId: number) {
  await ensureNotificationSettingsTable();
  const row = await fetchSettingsRow(userId);
  if (!row) return null;
  return mapRowToSettings(row);
}

export async function saveNotificationSettings(
  userId: number,
  input: Partial<NotificationSettings> | NotificationSettings
) {
  await ensureNotificationSettingsTable();
  const existingRow = await fetchSettingsRow(userId);
  const currentSettings = existingRow
    ? mapRowToSettings(existingRow)
    : DEFAULT_NOTIFICATION_SETTINGS;
  const nextSettings = normalizeNotificationSettings({
    ...currentSettings,
    ...(input ?? {}),
  });

  if (existingRow) {
    await prisma.$executeRaw`
      UPDATE "UserNotificationSetting"
      SET
        "commentReply" = ${toDbBoolean(nextSettings.commentReply)},
        "commentMention" = ${toDbBoolean(nextSettings.commentMention)},
        "threadMention" = ${toDbBoolean(nextSettings.threadMention)},
        "galleryMention" = ${toDbBoolean(nextSettings.galleryMention)},
        "newMessage" = ${toDbBoolean(nextSettings.newMessage)},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "userId" = ${userId};
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO "UserNotificationSetting" (
        "userId",
        "commentReply",
        "commentMention",
        "threadMention",
        "galleryMention",
        "newMessage"
      )
      VALUES (
        ${userId},
        ${toDbBoolean(nextSettings.commentReply)},
        ${toDbBoolean(nextSettings.commentMention)},
        ${toDbBoolean(nextSettings.threadMention)},
        ${toDbBoolean(nextSettings.galleryMention)},
        ${toDbBoolean(nextSettings.newMessage)}
      );
    `;
  }

  return nextSettings;
}
