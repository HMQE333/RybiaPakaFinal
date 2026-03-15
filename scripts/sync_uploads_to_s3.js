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

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}.`);
    process.exit(1);
  }
  return value;
}

function normalizeBaseUrl(value) {
  const trimmed = value.trim();
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function findSourceRoots() {
  const roots = [];
  const envDir = process.env.UPLOADS_DIR;
  if (envDir) roots.push(envDir);
  roots.push(path.join(__dirname, "..", "public", "uploads"));
  roots.push(path.join(__dirname, "..", "uploads"));
  return roots.filter((dir) => fs.existsSync(dir));
}

function listMappings(roots, publicBase, avatarPrefix, galleryPrefix) {
  const mappings = [];

  for (const root of roots) {
    const avatarsDir = path.join(root, "avatars");
    if (fs.existsSync(avatarsDir)) {
      mappings.push({
        sourceDir: avatarsDir,
        destPrefix: avatarPrefix,
        fromUrl: "/uploads/avatars/",
        toUrl: `${publicBase}${avatarPrefix}/`,
      });
    }

    const galeriaDir = path.join(root, "galeria");
    if (fs.existsSync(galeriaDir)) {
      mappings.push({
        sourceDir: galeriaDir,
        destPrefix: galleryPrefix,
        fromUrl: "/uploads/galeria/",
        toUrl: `${publicBase}${galleryPrefix}/`,
      });
    }

    const galleryDir = path.join(root, "gallery");
    if (fs.existsSync(galleryDir)) {
      mappings.push({
        sourceDir: galleryDir,
        destPrefix: galleryPrefix,
        fromUrl: "/uploads/gallery/",
        toUrl: `${publicBase}${galleryPrefix}/`,
      });
    }
  }

  return mappings;
}

function syncDir(mapping, bucket, endpoint) {
  const args = [
    "s3",
    "sync",
    mapping.sourceDir,
    `s3://${bucket}/${mapping.destPrefix}`,
    "--only-show-errors",
    "--no-progress",
    "--exact-timestamps",
  ];

  if (process.env.DRY_RUN === "1") {
    args.push("--dryrun");
  }

  if (endpoint) {
    args.push("--endpoint-url", endpoint);
  }

  const result = spawnSync("aws", args, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      AWS_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
      AWS_DEFAULT_REGION: process.env.S3_REGION || "auto",
      AWS_EC2_METADATA_DISABLED: "true",
      ...(process.env.S3_FORCE_PATH_STYLE === "true"
        ? { AWS_S3_FORCE_PATH_STYLE: "true" }
        : {}),
    },
  });

  if (result.status && result.status !== 0) {
    process.exit(result.status);
  }
}

if (!commandExists("aws")) {
  console.error("AWS CLI not found. Install awscli and retry.");
  process.exit(1);
}

const bucket = requireEnv("S3_BUCKET");
const publicBase = normalizeBaseUrl(requireEnv("PUBLIC_BASE_URL"));
requireEnv("S3_ACCESS_KEY_ID");
requireEnv("S3_SECRET_ACCESS_KEY");
requireEnv("S3_ENDPOINT");

const endpoint = process.env.S3_ENDPOINT || "";
const avatarPrefix = process.env.S3_AVATAR_PREFIX || "avatars";
const galleryPrefix = process.env.S3_GALLERY_PREFIX || "gallery";

const roots = findSourceRoots();
if (roots.length === 0) {
  console.error("No uploads directory found.");
  process.exit(1);
}

const mappings = listMappings(roots, publicBase, avatarPrefix, galleryPrefix);
if (mappings.length === 0) {
  console.error("No upload subfolders (avatars/galeria/gallery) found.");
  process.exit(1);
}

for (const mapping of mappings) {
  syncDir(mapping, bucket, endpoint);
}

const outputPath =
  process.env.MAPPING_FILE ||
  path.join(__dirname, "uploads_url_mapping.json");
fs.writeFileSync(outputPath, JSON.stringify(mappings, null, 2));
console.log(`Saved URL mapping to ${outputPath}`);
