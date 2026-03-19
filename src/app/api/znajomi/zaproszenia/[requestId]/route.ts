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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const viewerId = await getViewerId(req);
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;
  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: string };

  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.status !== "PENDING") {
    return NextResponse.json({ error: "Nie znaleziono zaproszenia" }, { status: 404 });
  }

  if (action === "cancel") {
    if (request.senderId !== viewerId) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }
    await prisma.friendRequest.delete({ where: { id: requestId } });
    return NextResponse.json({ ok: true });
  }

  if (action === "accept" || action === "reject") {
    if (request.receiverId !== viewerId) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    if (action === "accept") {
      const [lo, hi] = [request.senderId, request.receiverId].sort((a, b) => a - b);
      await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: "ACCEPTED" },
        }),
        prisma.friendship.upsert({
          where: { aId_bId: { aId: lo, bId: hi } },
          update: {},
          create: { aId: lo, bId: hi },
        }),
      ]);
      await prisma.notification.create({
        data: {
          userId: request.senderId,
          type: "FRIEND_ACCEPTED",
          payload: JSON.stringify({ fromId: viewerId }),
        },
      }).catch(() => {});
    } else {
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
}
