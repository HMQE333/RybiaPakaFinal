const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function findProjectRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 6; i += 1) {
    const hasPackage = fs.existsSync(path.join(dir, "package.json"));
    const hasPrisma = fs.existsSync(path.join(dir, "prisma", "schema.prisma"));
    if (hasPackage && hasPrisma) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

function resolveSqliteFile(databaseUrl, schemaDir) {
  if (!databaseUrl || !databaseUrl.startsWith("file:")) return null;
  let filePath = databaseUrl.slice("file:".length);
  if (path.isAbsolute(filePath)) return filePath;

  if (/^\.{1,2}[\\/]/.test(filePath)) {
    const normalized = filePath.replace(
      /^\.{1,2}[\\/]+prisma[\\/]+/,
      "./"
    );
    return path.resolve(schemaDir, normalized);
  }

  const normalized = filePath.replace(/^prisma[\\/]+/, "");
  return path.resolve(schemaDir, normalized);
}

function getBin(root, name) {
  const binName = process.platform === "win32" ? `${name}.cmd` : name;
  const binPath = path.join(root, "node_modules", ".bin", binName);
  return fs.existsSync(binPath) ? binPath : null;
}

function shouldRun(envValue) {
  return envValue !== "0" && envValue !== "false";
}

function shouldRestore(envValue) {
  return envValue === "1" || envValue === "true";
}

const projectRoot = findProjectRoot(process.cwd());
const schemaDir = path.join(projectRoot, "prisma");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

const passengerPort = process.env.PASSENGER_APP_PORT;
if (passengerPort) {
  // Ensure Next.js uses the Passenger-assigned port on shared hosting.
  process.env.PORT = passengerPort;
}

const passengerHost = process.env.PASSENGER_APP_HOST;
const usingPassenger =
  Boolean(process.env.PASSENGER_APP_HOST) ||
  Boolean(process.env.PASSENGER_APP_PORT);
if (usingPassenger) {
  if (passengerHost) {
    process.env.HOSTNAME = passengerHost;
  }
} else if (process.env.PORT) {
  // Ensure container platforms bind to all interfaces.
  process.env.HOSTNAME = "0.0.0.0";
}

process.env.PRISMA_PROJECT_ROOT =
  process.env.PRISMA_PROJECT_ROOT || projectRoot;

const usingDataService = Boolean(process.env.DATA_BASE_URL);

if (!process.env.BETTER_AUTH_URL && process.env.NEXT_PUBLIC_SITE_URL) {
  process.env.BETTER_AUTH_URL = process.env.NEXT_PUBLIC_SITE_URL;
}

if (!process.env.NEXTAUTH_URL && process.env.BETTER_AUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.BETTER_AUTH_URL;
}

if (!process.env.NEXTAUTH_SECRET && process.env.BETTER_AUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = process.env.BETTER_AUTH_SECRET;
}

if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}

if (!usingDataService) {
  if (!process.env.DATABASE_URL) {
    const fallback = path.resolve(schemaDir, "dev.db");
    process.env.DATABASE_URL = `file:${fallback}`;
  }

  const sqlitePath = resolveSqliteFile(process.env.DATABASE_URL, schemaDir);
  if (sqlitePath) {
    process.env.DATABASE_URL = `file:${sqlitePath}`;
    fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
    if (!fs.existsSync(sqlitePath)) {
      const backup = path.join(schemaDir, "dev.db.bak");
      if (fs.existsSync(backup) && shouldRestore(process.env.PRISMA_RESTORE)) {
        fs.copyFileSync(backup, sqlitePath);
        console.log("Restored SQLite DB from prisma/dev.db.bak");
      }
    }
  }

  const prismaBin = getBin(projectRoot, "prisma");
  const repairScript = path.join(
    projectRoot,
    "scripts",
    "repair-prisma-migration.js"
  );
  if (
    prismaBin &&
    shouldRun(process.env.PRISMA_MIGRATE) &&
    fs.existsSync(repairScript)
  ) {
    const repair = spawnSync(process.execPath, [repairScript], {
      stdio: "inherit",
      cwd: projectRoot,
      env: process.env,
    });
    if (repair.status && repair.status !== 0) {
      process.exit(repair.status);
    }
  }
  if (prismaBin && shouldRun(process.env.PRISMA_MIGRATE)) {
    const migrate = spawnSync(prismaBin, ["migrate", "deploy"], {
      stdio: "inherit",
      cwd: projectRoot,
      env: process.env,
    });
    if (migrate.status && migrate.status !== 0) {
      process.exit(migrate.status);
    }
  } else if (!prismaBin && shouldRun(process.env.PRISMA_MIGRATE)) {
    console.log("Prisma CLI not found; skipping migrate deploy.");
  }

  if (prismaBin && shouldRun(process.env.PRISMA_GENERATE)) {
    const generate = spawnSync(prismaBin, ["generate"], {
      stdio: "inherit",
      cwd: projectRoot,
      env: process.env,
    });
    if (generate.status && generate.status !== 0) {
      process.exit(generate.status);
    }
  } else if (!prismaBin && shouldRun(process.env.PRISMA_GENERATE)) {
    console.log("Prisma CLI not found; skipping prisma generate.");
  }
}

const nextBin = getBin(projectRoot, "next") || "next";
const nextArgs = ["start"];
if (process.env.PORT) {
  nextArgs.push("-p", process.env.PORT);
}
if (process.env.HOSTNAME) {
  nextArgs.push("-H", process.env.HOSTNAME);
}
const child = spawn(nextBin, nextArgs, {
  stdio: "inherit",
  cwd: projectRoot,
  env: process.env,
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error(
    "Failed to start production server:",
    err && err.message ? err.message : err
  );
  process.exit(1);
});
