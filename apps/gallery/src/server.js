const { randomUUID } = require("crypto");
const path = require("path");

const cors = require("cors");
const express = require("express");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : false,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

function getProvidedToken(req) {
  const header = req.get("x-service-token");
  if (header) return header.trim();
  const auth = req.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  return match ? match[1].trim() : "";
}

function requireServiceToken(req, res, next) {
  const expected = process.env.SERVICE_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: "SERVICE_TOKEN_MISSING" });
  }
  const provided = getProvidedToken(req);
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
  return next();
}

const maxBytes = Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes },
});

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function isBlockedContent(buffer) {
  if (!buffer || buffer.length < 4) return false;
  const header = buffer.slice(0, 256).toString("utf8").toLowerCase();
  if (header.includes("<svg")) return true;
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) return true;
  return false;
}

function buildPublicUrl(key) {
  const base = String(process.env.PUBLIC_BASE_URL || "").trim();
  if (!base) {
    throw new Error("PUBLIC_BASE_URL_MISSING");
  }
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return new URL(key, normalized).toString();
}

function getS3Client() {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "auto";

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("S3_CREDENTIALS_MISSING");
  }

  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });
}

async function callDataService(pathname, payload) {
  const base = String(process.env.DATA_BASE_URL || "").trim();
  const token = String(process.env.DATA_SERVICE_TOKEN || "").trim();
  if (!base || !token) {
    throw new Error("DATA_SERVICE_NOT_CONFIGURED");
  }

  const url = `${base.replace(/\/+$/, "")}${pathname}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-service-token": token,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("DATA_SERVICE_FAILED");
  }

  return response.json();
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post(
  "/upload",
  requireServiceToken,
  upload.single("file"),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "FILE_MISSING" });
    }

    if (!ALLOWED_MIME.has(file.mimetype)) {
      return res.status(400).json({ error: "UNSUPPORTED_FILE_TYPE" });
    }

    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return res.status(400).json({ error: "INVALID_EXTENSION" });
    }

    if (isBlockedContent(file.buffer)) {
      return res.status(400).json({ error: "BLOCKED_CONTENT" });
    }

    const kind = String(req.body.kind || "gallery").trim().toLowerCase();
    const authorId = Number(req.body.authorId || 0);
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const category = String(req.body.category || "").trim();

    if (!Number.isInteger(authorId) || authorId <= 0) {
      return res.status(400).json({ error: "INVALID_AUTHOR" });
    }

    if (kind === "gallery") {
      if (!title || !category) {
        return res.status(400).json({ error: "MISSING_FIELDS" });
      }
    }

    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      return res.status(500).json({ error: "S3_BUCKET_MISSING" });
    }

    const keyPrefix = kind === "avatar" ? "avatars" : "gallery";
    const key = `${keyPrefix}/${randomUUID()}${ext}`;
    const s3 = getS3Client();

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: "public, max-age=31536000, immutable",
        })
      );
    } catch (error) {
      return res.status(500).json({ error: "UPLOAD_FAILED" });
    }

    const publicUrl = buildPublicUrl(key);

    if (kind === "gallery") {
      try {
        const dataResponse = await callDataService("/gallery/items", {
          title,
          description: description || null,
          category,
          imageUrl: publicUrl,
          authorId,
        });
        return res.status(201).json({ url: publicUrl, item: dataResponse.item });
      } catch (error) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        } catch {
          // ignore cleanup failures
        }
        return res.status(500).json({ error: "METADATA_FAILED" });
      }
    }

    return res.status(201).json({ url: publicUrl });
  }
);

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`Gallery service listening on ${host}:${port}`);
  }
});
