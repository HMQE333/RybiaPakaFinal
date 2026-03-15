export type ChannelMessageAuthor = {
  id: number | null;
  name: string;
  avatar?: string | null;
  role?: string | null;
};

export type ChannelMessage = {
  id: string;
  channelId: string;
  text: string;
  createdAt: string;
  hiddenAt?: string | null;
  author: ChannelMessageAuthor;
};

export type CustomEmoji = {
  id: number;
  label: string;
  src: string;
  code: string;
  legacyId?: number;
};
