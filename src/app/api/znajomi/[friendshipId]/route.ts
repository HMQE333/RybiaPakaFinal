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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  const viewerId = await getViewerId(req);
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendshipId } = await params;

  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    return NextResponse.json({ error: "Nie znaleziono znajomości" }, { status: 404 });
  }

  if (friendship.aId !== viewerId && friendship.bId !== viewerId) {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });

  return NextResponse.json({ ok: true });
}
