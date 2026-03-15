import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { AdminAuthError, requireAdminFromHeaders } from "@/lib/adminAccess";
import { listInfoEntries, setInfoEntries } from "@/lib/informacjeStore";
import {
  isInfoCategory,
  normalizeInfoDate,
  splitInfoContent,
  type InfoEntry,
} from "@/lib/informacjeTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const safeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeContent = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => safeText(String(item ?? "")))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return splitInfoContent(value);
  }
  return [];
};

const resolveViewerLabel = (viewer: {
  username?: string | null;
  nick?: string | null;
  email?: string | null;
}) => {
  if (viewer.username) return viewer.username;
  if (viewer.nick) return viewer.nick;
  if (viewer.email) return viewer.email.split("@")[0];
  return "Administrator";
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

  const entries = await listInfoEntries();
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  let viewer;
  try {
    viewer = await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", 400);
  }

  const title = safeText(body?.title);
  const summaryRaw = safeText(body?.summary);
  const author = safeText(body?.author) || resolveViewerLabel(viewer);
  const category = safeText(body?.category);
  const highlight = safeText(body?.highlight);
  const content = normalizeContent(body?.content);
  const publishedAt = normalizeInfoDate(body?.publishedAt ?? body?.date);
  const summary =
    summaryRaw ||
    (content.length > 0 ? content[0].slice(0, 160) : "") ||
    title;

  if (!title || !summary) {
    return jsonError("INVALID_INPUT", 422);
  }
  if (!isInfoCategory(category)) {
    return jsonError("INVALID_CATEGORY", 422);
  }

  const entry: InfoEntry = {
    id: crypto.randomUUID(),
    title,
    summary,
    author,
    category,
    highlight: highlight || null,
    content,
    publishedAt,
  };

  const entries = await listInfoEntries();
  const updated = await setInfoEntries([entry, ...entries]);

  await prisma.adminLog.create({
    data: {
      actorId: viewer.id,
      level: "INFO",
      message: `Dodano wpis informacji "${title}".`,
      context: JSON.stringify({
        action: "INFO_ENTRY_CREATE",
        entryId: entry.id,
      }),
    },
  });

  return NextResponse.json({ entry, entries: updated }, { status: 201 });
}
