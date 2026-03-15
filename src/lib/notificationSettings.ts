export type NotificationSettings = {
  commentReply: boolean;
  commentMention: boolean;
  threadMention: boolean;
  galleryMention: boolean;
  newMessage: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  commentReply: true,
  commentMention: true,
  threadMention: true,
  galleryMention: true,
  newMessage: true,
};

type NotificationSettingKey = keyof NotificationSettings;

const NOTIFICATION_TYPE_MAP: Record<string, NotificationSettingKey> = {
  COMMENT_REPLY: "commentReply",
  COMMENT_MENTION: "commentMention",
  THREAD_MENTION: "threadMention",
  GALLERY_MENTION: "galleryMention",
  NEW_MESSAGE: "newMessage",
};

const resolveBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") return value;
  return fallback;
};

export const normalizeNotificationSettings = (
  input?: Partial<NotificationSettings> | null
): NotificationSettings => {
  const source = input ?? {};
  return {
    commentReply: resolveBoolean(
      source.commentReply,
      DEFAULT_NOTIFICATION_SETTINGS.commentReply
    ),
    commentMention: resolveBoolean(
      source.commentMention,
      DEFAULT_NOTIFICATION_SETTINGS.commentMention
    ),
    threadMention: resolveBoolean(
      source.threadMention,
      DEFAULT_NOTIFICATION_SETTINGS.threadMention
    ),
    galleryMention: resolveBoolean(
      source.galleryMention,
      DEFAULT_NOTIFICATION_SETTINGS.galleryMention
    ),
    newMessage: resolveBoolean(
      source.newMessage,
      DEFAULT_NOTIFICATION_SETTINGS.newMessage
    ),
  };
};

export const resolveNotificationSettingKey = (
  rawType: string
): NotificationSettingKey | null => {
  if (!rawType) return null;
  const normalized = rawType.trim().toUpperCase();
  return NOTIFICATION_TYPE_MAP[normalized] ?? null;
};

export const isNotificationTypeAllowed = (
  rawType: string,
  settings: NotificationSettings
) => {
  const key = resolveNotificationSettingKey(rawType);
  if (!key) return true;
  return settings[key];
};
