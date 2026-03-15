import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { isSqliteProvider } from "@/lib/dbProvider";
import prisma from "@/lib/prisma";

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

const CREATE_INDEX_SQL = `
  CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key"
  ON "NewsletterSubscriber"("email");
`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function ensureNewsletterTable() {
  if (!isSqliteProvider()) return;
  await prisma.$executeRawUnsafe(CREATE_TABLE_SQL);
  await prisma.$executeRawUnsafe(CREATE_INDEX_SQL);
}

async function readEmail(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    return String(body?.email ?? "").trim().toLowerCase();
  }
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    return String(form.get("email") ?? "").trim().toLowerCase();
  }
  return "";
}

export async function POST(req: NextRequest) {
  const email = await readEmail(req);
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  try {
    await ensureNewsletterTable();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure newsletter table", error);
    return NextResponse.json({ error: "SETUP_FAILED" }, { status: 500 });
  }

  try {
    const inserted = await prisma.$executeRaw`
      INSERT INTO "NewsletterSubscriber" ("id", "email")
      VALUES (${randomUUID()}, ${email})
      ON CONFLICT("email") DO NOTHING;
    `;

    return NextResponse.json({
      status: Number(inserted) > 0 ? "CREATED" : "EXISTS",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to save newsletter subscriber", error);
    return NextResponse.json({ error: "FAILED_TO_SAVE" }, { status: 500 });
  }
}
