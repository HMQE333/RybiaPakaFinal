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

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: viewerId }, { receiverId: viewerId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, username: true, nick: true, name: true, avatarUrl: true, image: true } },
      receiver: { select: { id: true, username: true, nick: true, name: true, avatarUrl: true, image: true } },
    },
  });

  const conversationsMap = new Map<
    number,
    {
      otherId: number;
      other: { id: number; username: string | null; nick: string | null; name: string; avatarUrl: string | null };
      lastMessage: { text: string; createdAt: string; isMine: boolean };
      unreadCount: number;
    }
  >();

  for (const msg of messages) {
    const otherId = msg.senderId === viewerId ? msg.receiverId : msg.senderId;
    const other = msg.senderId === viewerId ? msg.receiver : msg.sender;
    const isMine = msg.senderId === viewerId;
    const isUnread = !isMine && !msg.readAt;

    if (!conversationsMap.has(otherId)) {
      conversationsMap.set(otherId, {
        otherId,
        other: {
          id: other.id,
          username: other.username,
          nick: other.nick,
          name: other.name,
          avatarUrl: other.avatarUrl || other.image || null,
        },
        lastMessage: { text: msg.text, createdAt: msg.createdAt.toISOString(), isMine },
        unreadCount: isUnread ? 1 : 0,
      });
    } else {
      const conv = conversationsMap.get(otherId)!;
      if (isUnread) conv.unreadCount++;
    }
  }

  const conversations = Array.from(conversationsMap.values());

  return NextResponse.json({ conversations });
}
