const fs = require("node:fs");
const path = require("node:path");

const url = process.env.LOGO_URL || "http://localhost:3000/logo.png";
const filePath = path.join(__dirname, "..", "public", "logo.png");

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!fs.existsSync(filePath)) {
  fail(`Missing file: ${filePath}`);
}

async function checkUrl() {
  let res = await fetch(url, { method: "HEAD" }).catch(() => null);
  if (!res || !res.ok) {
    res = await fetch(url).catch(() => null);
  }
  if (!res || !res.ok) {
    fail(`Logo URL failed: ${url}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    fail(`Unexpected content-type for logo: ${contentType || "missing"}`);
  }
}

checkUrl().then(() => {
  console.log(`Logo OK: ${url}`);
});
