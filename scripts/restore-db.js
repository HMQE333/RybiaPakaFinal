const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dbPath = path.join(repoRoot, "prisma", "dev.db");
const bakPath = path.join(repoRoot, "prisma", "dev.db.bak");

try {
  if (!fs.existsSync(dbPath) && fs.existsSync(bakPath)) {
    fs.copyFileSync(bakPath, dbPath);
    console.log("Restored prisma/dev.db from prisma/dev.db.bak");
    process.exit(0);
  }
  console.log(
    "No restore needed: prisma/dev.db already exists or no backup found"
  );
  process.exit(0);
} catch (err) {
  console.error(
    "Failed to restore DB:",
    err && err.message ? err.message : err
  );
  process.exit(1);
}
