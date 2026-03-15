const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { PrismaClient, Prisma } = require("@prisma/client");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const prisma = new PrismaClient();

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

const bodyLimit =
  process.env.JSON_BODY_LIMIT || process.env.MAX_BODY_BYTES || "2mb";
app.use(express.json({ limit: bodyLimit }));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX || 120),
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

function isSqlFragment(value) {
  return (
    value &&
    typeof value === "object" &&
    Array.isArray(value.values) &&
    Array.isArray(value.strings)
  );
}

function reviveSqlValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => reviveSqlValue(item));
  }
  if (isSqlFragment(value)) {
    return Prisma.sql(
      value.strings,
      ...value.values.map((item) => reviveSqlValue(item))
    );
  }
  return value;
}

function reviveArgs(args) {
  if (!Array.isArray(args)) return [];
  return args.map((arg) => reviveSqlValue(arg));
}

function resolveModelOperation(operation) {
  const modelName = String(operation.model || "").trim();
  const methodName = String(operation.method || "").trim();
  const model = prisma[modelName];
  if (!model || typeof model[methodName] !== "function") {
    throw new Error("UNKNOWN_MODEL_OPERATION");
  }
  return model[methodName](...reviveArgs(operation.args));
}

function resolveRootOperation(operation) {
  const methodName = String(operation.method || "").trim();
  const handler = prisma[methodName];
  if (typeof handler !== "function") {
    throw new Error("UNKNOWN_ROOT_OPERATION");
  }
  return handler.apply(prisma, reviveArgs(operation.args));
}

function resolveOperation(operation) {
  if (!operation || typeof operation !== "object") {
    throw new Error("INVALID_OPERATION");
  }
  if (operation.type === "model") {
    return resolveModelOperation(operation);
  }
  if (operation.type === "root") {
    return resolveRootOperation(operation);
  }
  throw new Error("UNSUPPORTED_OPERATION");
}

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1;`;
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false });
  }
});

app.get("/api/health/data", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1;`;
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false });
  }
});

app.post("/rpc/prisma", requireServiceToken, async (req, res) => {
  const payload = req.body;

  try {
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "INVALID_PAYLOAD" });
    }

    if (payload.type === "transaction") {
      const operations = Array.isArray(payload.operations)
        ? payload.operations
        : [];
      if (operations.length === 0) {
        return res.status(400).json({ error: "EMPTY_TRANSACTION" });
      }
      const prismaOps = operations.map((op) => resolveOperation(op));
      const result = await prisma.$transaction(prismaOps);
      return res.json({ ok: true, result });
    }

    const result = await resolveOperation(payload);
    return res.json({ ok: true, result });
  } catch (error) {
    const message =
      error && error.message ? error.message : "FAILED_TO_EXECUTE";
    return res.status(500).json({ error: message });
  }
});

app.post("/gallery/items", requireServiceToken, async (req, res) => {
  const body = req.body || {};
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const category = String(body.category || "").trim();
  const imageUrl = String(body.imageUrl || "").trim();
  const authorId = Number(body.authorId || 0);
  const id = body.id ? String(body.id).trim() : null;

  if (!title || !category || !imageUrl || !Number.isInteger(authorId)) {
    return res.status(400).json({ error: "INVALID_INPUT" });
  }

  try {
    const created = await prisma.galleryItem.create({
      data: {
        id: id || undefined,
        title,
        description: description || null,
        imageUrl,
        category,
        authorId,
      },
    });
    return res.status(201).json({ item: created });
  } catch (error) {
    return res.status(500).json({ error: "FAILED_TO_SAVE" });
  }
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

const server = app.listen(port, host, () => {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`Data service listening on ${host}:${port}`);
  }
});

process.on("SIGTERM", async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // ignore
  } finally {
    server.close(() => process.exit(0));
  }
});
