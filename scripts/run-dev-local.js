const { spawn } = require("child_process");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dbPath = path.join(repoRoot, "prisma", "dev.db");

// Ensure env var points to an absolute path so Prisma always finds the DB.
process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${dbPath}`;

// Spawn the package manager dev script (pnpm preferred, fallback to npm)
const cmd = process.platform === "win32" ? "pnpm" : "pnpm";
const args = ["dev"];

const child = spawn(cmd, args, { stdio: "inherit", shell: true });
child.on("exit", (code) => process.exit(code));
child.on("error", (err) => {
  console.error(
    "Failed to start dev server:",
    err && err.message ? err.message : err
  );
  process.exit(1);
});
