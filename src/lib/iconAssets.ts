export const ICON_PLACEHOLDER = "/icons/placeholder.svg";

export const SOCIAL_ICON_URLS = {
  google: "/icons/gmail.png",
  facebook: "/icons/facebook.png",
  discord: "/icons/discord.png",
} as const;

export type SocialIconKey = keyof typeof SOCIAL_ICON_URLS;
