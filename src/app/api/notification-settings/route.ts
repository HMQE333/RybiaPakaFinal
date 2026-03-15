import { NextRequest, NextResponse } from "next/server";

import { getSessionSafe } from "@/lib/auth";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/notificationSettings";
import {
  getNotificationSettings,
  saveNotificationSettings,
} from "@/lib/notificationSettingsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveSessionUserId(req: NextRequest) {
  try {
    const session = await getSessionSafe(req.headers);
    const parsed = Number(session?.user?.id ?? "");
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export async function GET(req: NextRequest) {
  const userId = await resolveSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const existing = await getNotificationSettings(userId);
    const settings =
      existing ?? (await saveNotificationSettings(userId, DEFAULT_NOTIFICATION_SETTINGS));
    return NextResponse.json(
      { ok: true, settings },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load notification settings", error);
    return NextResponse.json({ error: "FAILED_TO_LOAD" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await resolveSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const rawSettings =
    body && typeof body === "object"
      ? body?.settings && typeof body.settings === "object"
        ? body.settings
        : body
      : {};

  try {
    const settings = await saveNotificationSettings(userId, rawSettings);
    return NextResponse.json(
      { ok: true, settings },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to save notification settings", error);
    return NextResponse.json({ error: "FAILED_TO_SAVE" }, { status: 500 });
  }
}
