import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { VALID_EMOJI_IDS } from "@/lib/forumEmojis";
import { ensureRootPost, resolveSessionUserId } from "../../../_utils";

export const dynamic = "force-dynamic";

function parseThreadId(raw: string) {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

async function getReactionSummary(postId: number, viewerId: number | null) {
  const all = await prisma.reaction.findMany({
    where: {
      postId,
      type: { in: Array.from(VALID_EMOJI_IDS) },
    },
    select: { type: true, userId: true },
  });

  const counts: Record<string, number> = {};
  const mine: string[] = [];

  for (const r of all) {
    counts[r.type] = (counts[r.type] ?? 0) + 1;
    if (viewerId && r.userId === viewerId) mine.push(r.type);
  }

  return { counts, mine };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } | Promise<{ threadId: string }> }
) {
  const { threadId: rawThreadId } = await params;
  const threadId = parseThreadId(rawThreadId);
  if (!threadId) {
    return NextResponse.json({ error: "INVALID_THREAD" }, { status: 400 });
  }

  const viewerId = await resolveSessionUserId(req);
  if (!viewerId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const emoji = String(body?.emoji ?? "").trim();

  if (!VALID_EMOJI_IDS.has(emoji)) {
    return NextResponse.json({ error: "INVALID_EMOJI" }, { status: 400 });
  }

  const rootPost = await ensureRootPost(threadId);
  if (!rootPost) {
    return NextResponse.json({ error: "THREAD_NOT_FOUND" }, { status: 404 });
  }

  const existing = await prisma.reaction.findUnique({
    where: {
      postId_userId_type: {
        postId: rootPost.id,
        userId: viewerId,
        type: emoji,
      },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: { postId: rootPost.id, userId: viewerId, type: emoji },
    });
  }

  const { counts, mine } = await getReactionSummary(rootPost.id, viewerId);
  return NextResponse.json({ reacted: !existing, emoji, counts, mine });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } | Promise<{ threadId: string }> }
) {
  const { threadId: rawThreadId } = await params;
  const threadId = parseThreadId(rawThreadId);
  if (!threadId) {
    return NextResponse.json({ error: "INVALID_THREAD" }, { status: 400 });
  }

  const viewerId = await resolveSessionUserId(req);
  const rootPost = await ensureRootPost(threadId);
  if (!rootPost) {
    return NextResponse.json({ counts: {}, mine: [] });
  }

  const { counts, mine } = await getReactionSummary(rootPost.id, viewerId);
  return NextResponse.json({ counts, mine });
}
