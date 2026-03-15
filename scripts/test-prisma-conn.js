const path = require("path");
const fs = require("fs");

// Ensure DATABASE_URL is set to a sensible default before importing PrismaClient.
// This avoids "Unable to open the database file" when relative paths are resolved
// from a different working directory.
if (!process.env.DATABASE_URL) {
  const defaultDb = path.resolve(__dirname, "..", "prisma", "dev.db");
  // If a backup exists, copy it to dev.db so tests can run out-of-the-box.
  const backup = path.resolve(__dirname, "..", "prisma", "dev.db.bak");
  try {
    if (!fs.existsSync(defaultDb) && fs.existsSync(backup)) {
      fs.copyFileSync(backup, defaultDb);
    }
  } catch (err) {
    // ignore copy errors here; Prisma will report meaningful errors below
  }
  process.env.DATABASE_URL = `file:${defaultDb}`;
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$connect();
    console.log("connected");
  } catch (e) {
    // print more helpful diagnostics
    if (e && e.message) {
      console.error("connect failed:", e.message);
    } else if (e && e.code) {
      console.error("connect failed (code):", e.code);
    } else {
      console.error("connect failed:", e);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
