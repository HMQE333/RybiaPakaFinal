import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { AdminAuthError, requireAdminFromHeaders } from "@/lib/adminAccess";
import { Role } from "@/lib/prismaEnums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ModerationAction =
  | "KICK"
  | "BAN"
  | "SUSPEND"
  | "WARN"
  | "UNBAN"
  | "UNSUSPEND";

const ACTIONS: ModerationAction[] = [
  "KICK",
  "BAN",
  "SUSPEND",
  "WARN",
  "UNBAN",
  "UNSUSPEND",
];

function parseUserId(raw: string) {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getViewerLabel(viewer: {
  username: string | null;
  nick: string | null;
  email: string;
  id: number;
}) {
  return (
    viewer.username ||
    viewer.nick ||
    viewer.email ||
    `Admin #${viewer.id}`
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } | Promise<{ userId: string }> }
) {
  const { userId: rawUserId } = await params;
  const userId = parseUserId(rawUserId);
  if (!userId) return jsonError("INVALID_USER", 400);

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

  const action = String(body?.action ?? "").trim().toUpperCase();
  if (!ACTIONS.includes(action as ModerationAction)) {
    return jsonError("INVALID_ACTION", 422);
  }

  const reason = String(body?.reason ?? "").trim();
  if (reason.length > 500) {
    return jsonError("REASON_TOO_LONG", 422);
  }
  const durationMinutes = Number(body?.durationMinutes ?? 0);

  if (viewer.id === userId) {
    return jsonError("CANNOT_MODERATE_SELF", 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!target) return jsonError("USER_NOT_FOUND", 404);

  if (target.role === Role.OWNER && viewer.role !== Role.OWNER) {
    return jsonError("FORBIDDEN", 403);
  }

  const needsReason = ["KICK", "BAN", "SUSPEND", "WARN"].includes(action);
  if (needsReason && !reason) {
    return jsonError("REASON_REQUIRED", 422);
  }

  if (action === "SUSPEND") {
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return jsonError("INVALID_DURATION", 422);
    }
    if (durationMinutes > 60 * 24 * 365) {
      return jsonError("DURATION_TOO_LONG", 422);
    }
  }

  const now = new Date();
  const viewerLabel = getViewerLabel(viewer);

  let updateData: Record<string, any> = {};
  let logMessage = "";
  let logLevel = "INFO";
  let responseMessage = "";

  if (action === "KICK") {
    await prisma.session.deleteMany({ where: { userId } });
    updateData = {
      moderationNoticeType: "KICK",
      moderationNoticeReason: reason,
      moderationNoticeByLabel: viewerLabel,
      moderationNoticeAt: now,
      moderationNoticeSeenAt: null,
    };
    logMessage = `Wylogowano użytkownika ${target.email} (${target.id}). Powód: ${reason}.`;
    logLevel = "WARN";
    responseMessage = "Użytkownik został wylogowany.";
  } else if (action === "WARN") {
    updateData = {
      moderationNoticeType: "WARN",
      moderationNoticeReason: reason,
      moderationNoticeByLabel: viewerLabel,
      moderationNoticeAt: now,
      moderationNoticeSeenAt: null,
    };
    logMessage = `Wysłano ostrzeżenie do ${target.email} (${target.id}). Powód: ${reason}.`;
    logLevel = "INFO";
    responseMessage = "Ostrzeżenie wysłane.";
  } else if (action === "BAN") {
    await prisma.session.deleteMany({ where: { userId } });
    updateData = {
      bannedAt: now,
      banReason: reason,
      banByLabel: viewerLabel,
      suspensionUntil: null,
      suspensionReason: null,
      suspensionByLabel: null,
      suspensionAt: null,
    };
    logMessage = `Zablokowano konto ${target.email} (${target.id}). Powód: ${reason}.`;
    logLevel = "WARN";
    responseMessage = "Konto zostało zbanowane.";
  } else if (action === "UNBAN") {
    updateData = {
      bannedAt: null,
      banReason: null,
      banByLabel: null,
    };
    logMessage = `Cofnięto bana dla ${target.email} (${target.id}).`;
    responseMessage = "Ban został cofnięty.";
  } else if (action === "SUSPEND") {
    const until = new Date(now.getTime() + durationMinutes * 60 * 1000);
    updateData = {
      suspensionUntil: until,
      suspensionReason: reason,
      suspensionByLabel: viewerLabel,
      suspensionAt: now,
      bannedAt: null,
      banReason: null,
      banByLabel: null,
    };
    logMessage = `Nałożono przerwę na konto ${target.email} (${target.id}) do ${until.toISOString()}. Powód: ${reason}.`;
    logLevel = "WARN";
    responseMessage = "Przerwa została nałożona.";
  } else if (action === "UNSUSPEND") {
    updateData = {
      suspensionUntil: null,
      suspensionReason: null,
      suspensionByLabel: null,
      suspensionAt: null,
    };
    logMessage = `Zakończono przerwę dla ${target.email} (${target.id}).`;
    responseMessage = "Przerwa została zakończona.";
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      username: true,
      nick: true,
      role: true,
      bannedAt: true,
      banReason: true,
      banByLabel: true,
      suspensionUntil: true,
      suspensionReason: true,
      suspensionByLabel: true,
      suspensionAt: true,
    },
  });

  if (logMessage) {
    await prisma.adminLog.create({
      data: {
        actorId: viewer.id,
        level: logLevel,
        message: logMessage,
        context: JSON.stringify({
          action: `USER_${action}`,
          userId,
          reason: reason || null,
        }),
      },
    });
  }

  return NextResponse.json({ ok: true, message: responseMessage, user: updated });
}
