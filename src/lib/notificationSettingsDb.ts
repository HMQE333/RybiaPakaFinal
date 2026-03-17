import prisma from "@/lib/prisma";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
  normalizeNotificationSettings,
} from "@/lib/notificationSettings";

export async function ensureNotificationSettingsTable() {
  // Table is managed by Prisma schema — nothing to do at runtime
}

function mapRowToSettings(row: {
  commentReply: boolean;
  commentMention: boolean;
  threadMention: boolean;
  galleryMention: boolean;
  newMessage: boolean;
}): NotificationSettings {
  return normalizeNotificationSettings({
    commentReply: row.commentReply,
    commentMention: row.commentMention,
    threadMention: row.threadMention,
    galleryMention: row.galleryMention,
    newMessage: row.newMessage,
  });
}

export async function getNotificationSettings(userId: number) {
  const row = await prisma.userNotificationSetting.findUnique({
    where: { userId },
    select: {
      commentReply: true,
      commentMention: true,
      threadMention: true,
      galleryMention: true,
      newMessage: true,
    },
  });
  if (!row) return null;
  return mapRowToSettings(row);
}

export async function saveNotificationSettings(
  userId: number,
  input: Partial<NotificationSettings> | NotificationSettings
) {
  const existingRow = await prisma.userNotificationSetting.findUnique({
    where: { userId },
    select: {
      commentReply: true,
      commentMention: true,
      threadMention: true,
      galleryMention: true,
      newMessage: true,
    },
  });

  const currentSettings = existingRow
    ? mapRowToSettings(existingRow)
    : DEFAULT_NOTIFICATION_SETTINGS;

  const nextSettings = normalizeNotificationSettings({
    ...currentSettings,
    ...(input ?? {}),
  });

  await prisma.userNotificationSetting.upsert({
    where: { userId },
    create: {
      userId,
      commentReply: nextSettings.commentReply,
      commentMention: nextSettings.commentMention,
      threadMention: nextSettings.threadMention,
      galleryMention: nextSettings.galleryMention,
      newMessage: nextSettings.newMessage,
    },
    update: {
      commentReply: nextSettings.commentReply,
      commentMention: nextSettings.commentMention,
      threadMention: nextSettings.threadMention,
      galleryMention: nextSettings.galleryMention,
      newMessage: nextSettings.newMessage,
    },
  });

  return nextSettings;
}
