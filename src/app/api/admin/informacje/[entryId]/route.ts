import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { AdminAuthError, requireAdminFromHeaders } from "@/lib/adminAccess";
import { listInfoEntries, setInfoEntries } from "@/lib/informacjeStore";
import {
  isInfoCategory,
  normalizeInfoDate,
  splitInfoContent,
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

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: { entryId: string } | Promise<{ entryId: string }> }
) {
  const { entryId } = await params;
  const id = String(entryId ?? "").trim();
  if (!id) return jsonError("INVALID_ENTRY", 400);

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

  const entries = await listInfoEntries();
  const existing = entries.find((entry) => entry.id === id);
  if (!existing) return jsonError("ENTRY_NOT_FOUND", 404);

  const hasHighlight = Object.prototype.hasOwnProperty.call(body, "highlight");
  const hasContent = Object.prototype.hasOwnProperty.call(body, "content");
  const hasPublishedAt = Object.prototype.hasOwnProperty.call(body, "publishedAt");

  const title = safeText(body?.title) || existing.title;
  const summaryInput = safeText(body?.summary);
  const author = safeText(body?.author) || existing.author;
  const categoryInput = safeText(body?.category);
  const highlight = hasHighlight
    ? safeText(body?.highlight) || null
    : existing.highlight ?? null;
  const content = hasContent ? normalizeContent(body?.content) : existing.content;
  const publishedAt = hasPublishedAt
    ? normalizeInfoDate(body?.publishedAt ?? body?.date)
    : existing.publishedAt;
  const summary =
    summaryInput ||
    existing.summary ||
    (content.length > 0 ? content[0].slice(0, 160) : "") ||
    title;

  const category = isInfoCategory(categoryInput)
    ? categoryInput
    : existing.category;

  if (!title || !summary) {
    return jsonError("INVALID_INPUT", 422);
  }
  if (!isInfoCategory(category)) {
    return jsonError("INVALID_CATEGORY", 422);
  }

  const nextEntry = {
    ...existing,
    title,
    summary,
    author,
    category,
    highlight,
    content,
    publishedAt,
  };

  const updated = await setInfoEntries(
    entries.map((entry) => (entry.id === id ? nextEntry : entry))
  );

  await prisma.adminLog.create({
    data: {
      actorId: viewer.id,
      level: "INFO",
      message: `Zmieniono wpis informacji "${nextEntry.title}".`,
      context: JSON.stringify({
        action: "INFO_ENTRY_UPDATE",
        entryId: id,
      }),
    },
  });

  return NextResponse.json({ entry: nextEntry, entries: updated });
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: { entryId: string } | Promise<{ entryId: string }> }
) {
  const { entryId } = await params;
  const id = String(entryId ?? "").trim();
  if (!id) return jsonError("INVALID_ENTRY", 400);

  let viewer;
  try {
    viewer = await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

  const entries = await listInfoEntries();
  const existing = entries.find((entry) => entry.id === id);
  if (!existing) return jsonError("ENTRY_NOT_FOUND", 404);

  const updated = await setInfoEntries(entries.filter((entry) => entry.id !== id));

  await prisma.adminLog.create({
    data: {
      actorId: viewer.id,
      level: "INFO",
      message: `Usunięto wpis informacji "${existing.title}".`,
      context: JSON.stringify({
        action: "INFO_ENTRY_DELETE",
        entryId: id,
      }),
    },
  });

  return NextResponse.json({ ok: true, entries: updated });
}
