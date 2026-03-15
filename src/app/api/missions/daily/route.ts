import { NextRequest, NextResponse } from "next/server";

import { ensureGalleryTables } from "@/app/api/galeria/_utils";
import { getSessionSafe } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DAILY_MISSIONS, type DailyMissionId } from "@/lib/missions";

export const dynamic = "force-dynamic";

type MissionProgress = {
  id: DailyMissionId;
  goal: number;
  count: number;
};

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET(req: NextRequest) {
  const session = await getSessionSafe(req.headers);
  const userId = Number(session?.user?.id ?? "");

  const emptyMissions: MissionProgress[] = DAILY_MISSIONS.map((mission) => ({
    id: mission.id,
    goal: mission.goal,
    count: 0,
  }));

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ authenticated: false, missions: emptyMissions });
  }

  const start = startOfToday();
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  let postCount = 0;
  try {
    postCount = await prisma.post.count({
      where: {
        authorId: userId,
        deletedAt: null,
        createdAt: { gte: start, lt: end },
      },
    });
  } catch {
    postCount = 0;
  }

  let discussionCount = 0;
  try {
    discussionCount = await prisma.channelMessage.count({
      where: {
        authorId: userId,
        createdAt: { gte: start, lt: end },
      },
    });
  } catch {
    discussionCount = 0;
  }

  let photoCount = 0;
  try {
    await ensureGalleryTables();
    const galleryRows = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count
      FROM "GalleryItem"
      WHERE "authorId" = ${userId}
        AND "deletedAt" IS NULL
        AND "createdAt" >= ${start}
        AND "createdAt" < ${end};
    `;
    photoCount = Number(galleryRows?.[0]?.count ?? 0);
  } catch {
    photoCount = 0;
  }

  const counts: Record<DailyMissionId, number> = {
    post: postCount,
    discussion: discussionCount,
    photo: photoCount,
  };

  const missions: MissionProgress[] = DAILY_MISSIONS.map((mission) => ({
    id: mission.id,
    goal: mission.goal,
    count: counts[mission.id] ?? 0,
  }));

  return NextResponse.json({ authenticated: true, missions });
}
