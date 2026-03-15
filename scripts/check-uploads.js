const fs = require("node:fs");
const path = require("node:path");

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const uploadsDir = (
  process.env.UPLOADS_DIR || path.join(__dirname, "..", "public", "uploads")
).trim();
const strict = process.env.UPLOADS_CHECK_STRICT === "1";

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const findFirstFile = (dir) => {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      return path.join(dir, entry.name);
    }
  }
  return null;
};

const targets = [
  { label: "avatar", file: findFirstFile(path.join(uploadsDir, "avatars")) },
  { label: "gallery", file: findFirstFile(path.join(uploadsDir, "galeria")) },
].filter((target) => target.file);

if (targets.length === 0) {
  if (strict) {
    fail(`No uploads found in ${uploadsDir}`);
  } else {
    console.log(`No uploads found in ${uploadsDir}; skipping.`);
    process.exit(0);
  }
}

const toUrl = (filePath) => {
  const relative = path.relative(uploadsDir, filePath).split(path.sep).join("/");
  return new URL(`/uploads/${relative}`, siteUrl).toString();
};

async function checkUrl(url) {
  let res = await fetch(url, { method: "HEAD" }).catch(() => null);
  if (!res || !res.ok) {
    res = await fetch(url).catch(() => null);
  }
  if (!res || !res.ok) {
    fail(`Uploads URL failed: ${url}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    fail(`Unexpected content-type for uploads: ${contentType || "missing"}`);
  }
}

Promise.all(targets.map((target) => checkUrl(toUrl(target.file))))
  .then(() => {
    console.log(`Uploads OK (${targets.length}): ${siteUrl}`);
  })
  .catch((error) => {
    fail(error?.message || "Uploads check failed");
  });
