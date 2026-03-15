export function resolveUserEmail(
  provider: string,
  providerAccountId: string,
  rawEmail?: string | null
) {
  const normalized = rawEmail?.trim().toLowerCase();
  if (normalized) {
    return normalized;
  }
  const safeProvider = provider.trim().toLowerCase() || "oauth";
  return `${providerAccountId}@${safeProvider}.oauth.local`;
}
