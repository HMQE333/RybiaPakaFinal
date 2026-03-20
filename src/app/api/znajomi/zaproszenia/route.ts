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

  const [incoming, outgoing] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { receiverId: viewerId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, username: true, nick: true, name: true, avatarUrl: true, image: true },
        },
      },
    }),
    prisma.friendRequest.findMany({
      where: { senderId: viewerId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        receiver: {
          select: { id: true, username: true, nick: true, name: true, avatarUrl: true, image: true },
        },
      },
    }),
  ]);

  return NextResponse.json({ incoming, outgoing });
}

export async function POST(req: NextRequest) {
  const viewerId = await getViewerId(req);
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { username } = body as { username?: string };
  if (!username?.trim()) {
    return NextResponse.json({ error: "Brak nazwy użytkownika" }, { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { username: username.trim() },
    select: { id: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
  }
  if (target.id === viewerId) {
    return NextResponse.json({ error: "Nie możesz zaprosić siebie" }, { status: 400 });
  }

  const [existing, friendship] = await Promise.all([
    prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: viewerId, receiverId: target.id },
          { senderId: target.id, receiverId: viewerId },
        ],
        status: "PENDING",
      },
    }),
    prisma.friendship.findFirst({
      where: {
        OR: [
          { aId: viewerId, bId: target.id },
          { aId: target.id, bId: viewerId },
        ],
      },
    }),
  ]);

  if (existing) {
    return NextResponse.json({ error: "Zaproszenie już istnieje" }, { status: 409 });
  }
  if (friendship) {
    return NextResponse.json({ error: "Jesteście już znajomymi" }, { status: 409 });
  }

  const request = await prisma.friendRequest.create({
    data: { senderId: viewerId, receiverId: target.id, status: "PENDING" },
  });

  await prisma.notification.create({
    data: {
      userId: target.id,
      type: "FRIEND_REQUEST",
      payload: JSON.stringify({ requestId: request.id, fromId: viewerId }),
    },
  }).catch(() => {});

  return NextResponse.json({ request });
}
