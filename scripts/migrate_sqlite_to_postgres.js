const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function commandExists(cmd) {
  const result = spawnSync(cmd, ["--version"], {
    stdio: "ignore",
    shell: true,
  });
  return result.status === 0;
}

function runCommand(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    ...options,
  });
  if (result.status && result.status !== 0) {
    process.exit(result.status);
  }
}

function toSqliteUrl(filePath) {
  const resolved = path.resolve(filePath).replace(/\\/g, "/");
  return resolved.startsWith("/")
    ? `sqlite://${resolved}`
    : `sqlite:///${resolved}`;
}

function checkDatabaseEmpty(targetUrl) {
  if (process.env.SKIP_DB_EMPTY_CHECK === "1") {
    return;
  }
  if (!commandExists("psql")) {
    console.error("psql not found. Install PostgreSQL client or set SKIP_DB_EMPTY_CHECK=1.");
    process.exit(1);
  }

  const checkTable = spawnSync(
    "psql",
    [
      targetUrl,
      "-tAc",
      "SELECT to_regclass('\"User\"');",
    ],
    { encoding: "utf8", shell: true }
  );

  if (checkTable.status !== 0) {
    console.error("Failed to query target database. Ensure DATABASE_URL is reachable.");
    process.exit(1);
  }

  const hasUserTable = (checkTable.stdout || "").toString().trim();
  if (!hasUserTable) {
    console.error("Target schema missing. Run DATA migrations (prisma migrate deploy) first.");
    process.exit(1);
  }

  const countRows = spawnSync(
    "psql",
    [
      targetUrl,
      "-tAc",
      'SELECT COUNT(*) FROM "User";',
    ],
    { encoding: "utf8", shell: true }
  );

  if (countRows.status !== 0) {
    console.error("Failed to check target data state.");
    process.exit(1);
  }

  const count = Number((countRows.stdout || "").toString().trim());
  if (Number.isFinite(count) && count > 0) {
    console.error("Target database already has data. Aborting to keep migration idempotent.");
    process.exit(1);
  }
}

const sqlitePath =
  process.env.SQLITE_PATH ||
  path.join(__dirname, "..", "prisma", "dev.db");
const targetUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!targetUrl) {
  console.error("Set POSTGRES_URL or DATABASE_URL for the target Postgres database.");
  process.exit(1);
}

if (!fs.existsSync(sqlitePath)) {
  console.error(`SQLite file not found: ${sqlitePath}`);
  process.exit(1);
}

checkDatabaseEmpty(targetUrl);

const sqliteUrl = toSqliteUrl(sqlitePath);
const pgloaderArgs = [
  "--with",
  "data only",
  "--with",
  "quote identifiers",
  sqliteUrl,
  targetUrl,
];

if (commandExists("pgloader")) {
  runCommand("pgloader", pgloaderArgs);
  process.exit(0);
}

if (commandExists("docker")) {
  const dockerArgs = [
    "run",
    "--rm",
    "-v",
    `${path.resolve(sqlitePath)}:/db.sqlite3`,
    "dimitri/pgloader:latest",
    "pgloader",
    "--with",
    "data only",
    "--with",
    "quote identifiers",
    "sqlite:///db.sqlite3",
    targetUrl,
  ];
  runCommand("docker", dockerArgs);
  process.exit(0);
}

console.error("pgloader not found. Install pgloader or Docker and retry.");
process.exit(1);
