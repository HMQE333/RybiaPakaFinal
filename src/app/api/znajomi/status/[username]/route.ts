import { NextRequest, NextResponse } from "next/server";
import { getSessionSafe } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getSessionSafe(req.headers);
  const viewerId = Number(session?.user?.id ?? "");
  if (!Number.isInteger(viewerId) || viewerId <= 0) {
    return NextResponse.json({ status: "none" });
  }

  const { username } = await params;

  const target = await prisma.user.findFirst({
    where: { username },
    select: { id: true },
  });

  if (!target || target.id === viewerId) {
    return NextResponse.json({ status: "none" });
  }

  const [friendship, request] = await Promise.all([
    prisma.friendship.findFirst({
      where: {
        OR: [
          { aId: viewerId, bId: target.id },
          { aId: target.id, bId: viewerId },
        ],
      },
      select: { id: true },
    }),
    prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: viewerId, receiverId: target.id },
          { senderId: target.id, receiverId: viewerId },
        ],
        status: "PENDING",
      },
      select: { id: true, senderId: true },
    }),
  ]);

  if (friendship) {
    return NextResponse.json({ status: "friends", friendshipId: friendship.id });
  }
  if (request) {
    const status =
      request.senderId === viewerId ? "pending_sent" : "pending_received";
    return NextResponse.json({ status, requestId: request.id });
  }

  return NextResponse.json({ status: "none" });
}
