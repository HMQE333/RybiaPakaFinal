const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MIGRATION_NAME = "20251231235056_user_moderation";
const COLUMN_DEFS = [
  { name: "bannedAt", type: "DATETIME" },
  { name: "banReason", type: "TEXT" },
  { name: "banByLabel", type: "TEXT" },
  { name: "suspensionUntil", type: "DATETIME" },
  { name: "suspensionReason", type: "TEXT" },
  { name: "suspensionByLabel", type: "TEXT" },
  { name: "suspensionAt", type: "DATETIME" },
  { name: "moderationNoticeType", type: "TEXT" },
  { name: "moderationNoticeReason", type: "TEXT" },
  { name: "moderationNoticeByLabel", type: "TEXT" },
  { name: "moderationNoticeAt", type: "DATETIME" },
  { name: "moderationNoticeSeenAt", type: "DATETIME" },
];

function isSqliteUrl(value) {
  return typeof value === "string" && value.startsWith("file:");
}

function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL) return;
  const fallback = path.resolve(__dirname, "..", "prisma", "dev.db");
  process.env.DATABASE_URL = `file:${fallback}`;
}

function getBin(root, name) {
  const binName = process.platform === "win32" ? `${name}.cmd` : name;
  const binPath = path.join(root, "node_modules", ".bin", binName);
  return fs.existsSync(binPath) ? binPath : null;
}

function runPrismaGenerate(prismaBin, projectRoot) {
  if (!prismaBin) return false;
  const result = spawnSync(prismaBin, ["generate"], {
    stdio: "inherit",
    cwd: projectRoot,
    env: process.env,
  });
  return !result.status || result.status === 0;
}

function loadPrismaClient(prismaBin, projectRoot) {
  try {
    return require("@prisma/client").PrismaClient;
  } catch (err) {
    if (!runPrismaGenerate(prismaBin, projectRoot)) {
      return null;
    }
    try {
      return require("@prisma/client").PrismaClient;
    } catch (err2) {
      return null;
    }
  }
}

async function main() {
  ensureDatabaseUrl();

  if (!isSqliteUrl(process.env.DATABASE_URL)) {
    return;
  }

  const projectRoot = process.cwd();
  const prismaBin = getBin(projectRoot, "prisma");
  const PrismaClient = loadPrismaClient(prismaBin, projectRoot);
  if (!PrismaClient) {
    console.log("Prisma Client not available; skipping migration repair.");
    return;
  }

  const prisma = new PrismaClient();
  let shouldResolve = false;
  let migrationFailed = false;
  let hasAllColumns = false;

  try {
    const migrationTable = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'"
    );
    if (!Array.isArray(migrationTable) || migrationTable.length === 0) {
      return;
    }

    const migrationRows = await prisma.$queryRawUnsafe(
      `SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations WHERE migration_name = '${MIGRATION_NAME}'`
    );
    const row = Array.isArray(migrationRows) ? migrationRows[0] : null;
    migrationFailed = Boolean(row && (!row.finished_at || row.rolled_back_at));

    if (!migrationFailed) {
      return;
    }

    const rows = await prisma.$queryRawUnsafe('PRAGMA table_info("User")');
    const colNames = new Set(
      Array.isArray(rows) ? rows.map((item) => item.name) : []
    );
    const missing = COLUMN_DEFS.filter((col) => !colNames.has(col.name));
    if (missing.length) {
      for (const col of missing) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "User" ADD COLUMN "${col.name}" ${col.type}`
        );
      }
    }
    hasAllColumns = true;
    shouldResolve = true;
  } finally {
    await prisma.$disconnect();
  }

  if (!shouldResolve || !hasAllColumns) {
    return;
  }

  if (!prismaBin) {
    console.log("Prisma CLI not found; skipping migration resolve.");
    return;
  }

  const result = spawnSync(
    prismaBin,
    ["migrate", "resolve", "--applied", MIGRATION_NAME],
    {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
    }
  );

  if (result.status && result.status !== 0) {
    process.exit(result.status);
  }
}

main().catch((err) => {
  console.error(
    "Migration repair failed:",
    err && err.message ? err.message : err
  );
  process.exit(1);
});
