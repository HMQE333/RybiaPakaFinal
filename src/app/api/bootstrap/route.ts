import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getSessionSafe } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SiteSettingsPayload = {
  siteName: string;
  maintenance: boolean;
  headerBadge: string;
};

type ModerationPayload = {
  status: "anon" | "ok" | "banned" | "suspended";
  ban?: {
    at?: string | null;
    reason?: string | null;
    by?: string | null;
  } | null;
  suspension?: {
    until?: string | null;
    at?: string | null;
    reason?: string | null;
    by?: string | null;
  } | null;
  notice?: {
    type?: string | null;
    reason?: string | null;
    by?: string | null;
    at?: string | null;
  } | null;
};

function jsonResponse(data: Record<string, unknown>) {
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

async function loadSiteSettings(): Promise<SiteSettingsPayload> {
  const items = await prisma.siteSetting.findMany();
  const map = Object.fromEntries(items.map((i) => [i.key, i.value]));

  return {
    siteName: map.siteName ?? "RybiaPaka.pl",
    maintenance: map.maintenanceMode === "true",
    headerBadge: map.headerBadge ?? "",
  };
}

async function loadModeration(viewerId: number): Promise<ModerationPayload> {
  if (!Number.isInteger(viewerId) || viewerId <= 0) {
    return { status: "anon" };
  }

  const user = await prisma.user.findUnique({
    where: { id: viewerId },
    select: {
      id: true,
      bannedAt: true,
      banReason: true,
      banByLabel: true,
      suspensionUntil: true,
      suspensionReason: true,
      suspensionByLabel: true,
      suspensionAt: true,
      moderationNoticeType: true,
      moderationNoticeReason: true,
      moderationNoticeByLabel: true,
      moderationNoticeAt: true,
      moderationNoticeSeenAt: true,
    },
  });

  if (!user) {
    return { status: "anon" };
  }

  const now = new Date();
  if (user.suspensionUntil && user.suspensionUntil <= now) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        suspensionUntil: null,
        suspensionReason: null,
        suspensionByLabel: null,
        suspensionAt: null,
      },
    });
    user.suspensionUntil = null;
    user.suspensionReason = null;
    user.suspensionByLabel = null;
    user.suspensionAt = null;
  }

  const banned = Boolean(user.bannedAt);
  const suspended = Boolean(user.suspensionUntil && user.suspensionUntil > now);

  const noticeAvailable = Boolean(
    user.moderationNoticeAt &&
      (!user.moderationNoticeSeenAt ||
        user.moderationNoticeSeenAt < user.moderationNoticeAt)
  );

  return {
    status: banned ? "banned" : suspended ? "suspended" : "ok",
    ban: banned
      ? {
          at: user.bannedAt?.toISOString() ?? null,
          reason: user.banReason ?? null,
          by: user.banByLabel ?? null,
        }
      : null,
    suspension: suspended
      ? {
          until: user.suspensionUntil?.toISOString() ?? null,
          at: user.suspensionAt?.toISOString() ?? null,
          reason: user.suspensionReason ?? null,
          by: user.suspensionByLabel ?? null,
        }
      : null,
    notice: noticeAvailable
      ? {
          type: user.moderationNoticeType ?? null,
          reason: user.moderationNoticeReason ?? null,
          by: user.moderationNoticeByLabel ?? null,
          at: user.moderationNoticeAt?.toISOString() ?? null,
        }
      : null,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSessionSafe(req.headers);
  const viewerId = Number(session?.user?.id ?? "");

  const [settings, moderation] = await Promise.all([
    loadSiteSettings(),
    loadModeration(viewerId),
  ]);

  return jsonResponse({
    session: session ? { user: session.user } : null,
    settings,
    moderation,
  });
}
