export const DEFAULT_AVATAR_PATHS = Array.from({ length: 10 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return `/avatars/default-${number}.svg`;
});

export const DEFAULT_AVATARS = DEFAULT_AVATAR_PATHS.map((src, index) => ({
  id: `default-${String(index + 1).padStart(2, "0")}`,
  src,
}));

export function getRandomDefaultAvatar() {
  const index = Math.floor(Math.random() * DEFAULT_AVATAR_PATHS.length);
  return DEFAULT_AVATAR_PATHS[index];
}

export function isDefaultAvatar(value?: string | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? DEFAULT_AVATAR_PATHS.includes(trimmed) : false;
}
