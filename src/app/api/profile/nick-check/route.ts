import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const NICK_REGEX = /^[a-zA-Z0-9_\-]{3,20}$/;

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const nick = req.nextUrl.searchParams.get("nick")?.trim() ?? "";

  if (!nick) {
    return NextResponse.json({ available: false, reason: "EMPTY" });
  }

  if (!NICK_REGEX.test(nick)) {
    return NextResponse.json({ available: false, reason: "INVALID_FORMAT" });
  }

  const currentUserId =
    typeof session.user.id === "string"
      ? parseInt(session.user.id, 10)
      : (session.user.id as unknown as number);

  const existing = await prisma.$queryRaw<{ id: number }[]>`
    SELECT "id" FROM "User"
    WHERE (lower("nick") = ${nick.toLowerCase()} OR lower("username") = ${nick.toLowerCase()})
      AND "id" != ${currentUserId}
    LIMIT 1
  `;

  return NextResponse.json({ available: existing.length === 0 });
}
