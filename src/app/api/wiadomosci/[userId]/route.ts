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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const viewerId = await getViewerId(req);
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: userIdStr } = await params;
  const otherId = Number(userIdStr);
  if (!Number.isInteger(otherId) || otherId <= 0) {
    return NextResponse.json({ error: "Nieprawidłowy użytkownik" }, { status: 400 });
  }

  const other = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true, username: true, nick: true, name: true, avatarUrl: true },
  });
  if (!other) {
    return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
  }

  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  const limit = 40;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: viewerId, receiverId: otherId },
        { senderId: otherId, receiverId: viewerId },
      ],
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      sender: { select: { id: true, username: true, nick: true, name: true, avatarUrl: true } },
    },
  });

  await prisma.message.updateMany({
    where: { senderId: otherId, receiverId: viewerId, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    other,
    messages: messages.reverse().map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt ? m.readAt.toISOString() : null,
      isMine: m.senderId === viewerId,
      sender: m.sender,
    })),
    hasMore: messages.length === limit,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const viewerId = await getViewerId(req);
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: userIdStr } = await params;
  const otherId = Number(userIdStr);
  if (!Number.isInteger(otherId) || otherId <= 0) {
    return NextResponse.json({ error: "Nieprawidłowy użytkownik" }, { status: 400 });
  }

  if (otherId === viewerId) {
    return NextResponse.json({ error: "Nie możesz pisać do siebie" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "Nieprawidłowa treść wiadomości" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { senderId: viewerId, receiverId: otherId, text },
    include: {
      sender: { select: { id: true, username: true, nick: true, name: true, avatarUrl: true } },
    },
  });

  await prisma.notification.create({
    data: {
      userId: otherId,
      type: "NEW_MESSAGE",
      payload: JSON.stringify({ fromId: viewerId, messageId: message.id }),
    },
  }).catch(() => {});

  return NextResponse.json({
    id: message.id,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
    readAt: null,
    isMine: true,
    sender: message.sender,
  });
}
