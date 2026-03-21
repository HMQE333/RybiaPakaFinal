import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getSessionSafe } from "@/lib/auth";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/notificationSettings";
import { getNotificationSettings } from "@/lib/notificationSettingsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  let session: { user?: { id?: number | string } } | null = null;
  try {
    session = await getSessionSafe(req.headers);
  } catch {
    session = null;
  }

  const userId = Number(session?.user?.id ?? "");
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let ids: string[] | null = null;
  try {
    const body = await req.json();
    if (Array.isArray(body?.ids)) {
      ids = body.ids.filter((id: unknown) => typeof id === "string");
    }
  } catch {
    // mark all
  }

  await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
      ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest) {
  let session: { user?: { id?: number | string } } | null = null;
  try {
    session = await getSessionSafe(req.headers);
  } catch {
    session = null;
  }

  const userId = Number(session?.user?.id ?? "");
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json(
      { count: 0, items: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  let settings = DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const stored = await getNotificationSettings(userId);
    if (stored) {
      settings = stored;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load notification settings", error);
  }

  const disabledTypes: string[] = [];
  if (!settings.commentReply) disabledTypes.push("COMMENT_REPLY");
  if (!settings.commentMention) disabledTypes.push("COMMENT_MENTION");
  if (!settings.threadMention) disabledTypes.push("THREAD_MENTION");
  if (!settings.galleryMention) disabledTypes.push("GALLERY_MENTION");
  if (!settings.newMessage) disabledTypes.push("NEW_MESSAGE");

  const typeFilter =
    disabledTypes.length > 0 ? { NOT: { type: { in: disabledTypes } } } : {};

  const [count, items] = await Promise.all([
    prisma.notification.count({
      where: { userId, readAt: null, ...typeFilter },
    }),
    prisma.notification.findMany({
      where: { userId, ...typeFilter },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        payload: true,
        createdAt: true,
        readAt: true,
      },
    }),
  ]);

  return NextResponse.json(
    {
      count,
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        payload: item.payload ?? null,
        createdAt: item.createdAt.toISOString(),
        readAt: item.readAt ? item.readAt.toISOString() : null,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
