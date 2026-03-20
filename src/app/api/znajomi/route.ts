import { NextRequest, NextResponse } from "next/server";
import { getSessionSafe } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getViewerId(req: NextRequest) {
  const session = await getSessionSafe(req.headers);
  const id = Number(session?.user?.id ?? "");
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(req: NextRequest) {
  const viewerId = await getViewerId(req);
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ aId: viewerId }, { bId: viewerId }] },
    include: {
      a: { select: { id: true, username: true, nick: true, name: true, avatarUrl: true, image: true } },
      b: { select: { id: true, username: true, nick: true, name: true, avatarUrl: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends = friendships.map((f) => {
    const raw = f.aId === viewerId ? f.b : f.a;
    return {
      friendshipId: f.id,
      friend: {
        id: raw.id,
        username: raw.username,
        nick: raw.nick,
        name: raw.name,
        avatarUrl: raw.avatarUrl || raw.image || null,
      },
      since: f.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ friends });
}
