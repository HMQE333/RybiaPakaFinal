import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/profile";

export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } | Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await getUser(username);

  if (!user) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(user);
}
