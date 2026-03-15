export function isSqliteProvider() {
  const override = process.env.DATA_DB_PROVIDER;
  if (override) {
    return override.trim().toLowerCase() === "sqlite";
  }
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const url = process.env.DATABASE_URL;
  return typeof url === "string" && url.startsWith("file:");
}
