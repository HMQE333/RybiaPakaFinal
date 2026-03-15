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

function escapeLiteral(value) {
  return value.replace(/'/g, "''");
}

function loadMappings() {
  const mappingFile =
    process.env.MAPPING_FILE ||
    path.join(__dirname, "uploads_url_mapping.json");

  if (fs.existsSync(mappingFile)) {
    const raw = fs.readFileSync(mappingFile, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  }

  const publicBase = process.env.PUBLIC_BASE_URL;
  if (!publicBase) {
    console.error("Missing PUBLIC_BASE_URL and no mapping file found.");
    process.exit(1);
  }
  const normalized = publicBase.endsWith("/") ? publicBase : `${publicBase}/`;
  return [
    {
      fromUrl: "/uploads/avatars/",
      toUrl: `${normalized}avatars/`,
    },
    {
      fromUrl: "/uploads/galeria/",
      toUrl: `${normalized}gallery/`,
    },
  ];
}

function buildUpdates(mappings) {
  const updates = [];
  for (const mapping of mappings) {
    if (!mapping?.fromUrl || !mapping?.toUrl) continue;
    const fromUrl = String(mapping.fromUrl);
    const toUrl = String(mapping.toUrl);
    if (fromUrl.includes("/avatars/")) {
      updates.push({
        table: '"User"',
        column: '"avatarUrl"',
        fromUrl,
        toUrl,
      });
    }
    if (fromUrl.includes("/galeria/") || fromUrl.includes("/gallery/")) {
      updates.push({
        table: '"GalleryItem"',
        column: '"imageUrl"',
        fromUrl,
        toUrl,
      });
    }
  }
  return updates;
}

const targetUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!targetUrl) {
  console.error("Set POSTGRES_URL or DATABASE_URL for the target Postgres database.");
  process.exit(1);
}

if (!commandExists("psql")) {
  console.error("psql not found. Install PostgreSQL client and retry.");
  process.exit(1);
}

const mappings = loadMappings();
const updates = buildUpdates(mappings);

if (updates.length === 0) {
  console.error("No URL mappings found to update.");
  process.exit(1);
}

const statements = updates.map((update) => {
  const fromLiteral = escapeLiteral(update.fromUrl);
  const toLiteral = escapeLiteral(update.toUrl);
  return `
    UPDATE ${update.table}
    SET ${update.column} = REPLACE(${update.column}, '${fromLiteral}', '${toLiteral}')
    WHERE ${update.column} LIKE '${fromLiteral}%';
  `;
});

const sql = statements.join("\n");

const result = spawnSync("psql", [targetUrl, "-v", "ON_ERROR_STOP=1"], {
  input: sql,
  stdio: ["pipe", "inherit", "inherit"],
  shell: true,
});

if (result.status && result.status !== 0) {
  process.exit(result.status);
}

console.log("URL update complete.");
