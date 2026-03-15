import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ensureRootPost, resolveSessionUserId } from "../../../_utils";

const LIKE_TYPE = "LIKE";

export const dynamic = "force-dynamic";

function parseThreadId(raw: string) {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
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
  const rootPost = await ensureRootPost(threadId);

  if (!rootPost) {
    return NextResponse.json({ error: "THREAD_NOT_FOUND" }, { status: 404 });
  }

  const existing = await prisma.reaction.findUnique({
    where: {
      postId_userId_type: {
        postId: rootPost.id,
        userId: viewerId,
        type: LIKE_TYPE,
      },
    },
  });

  try {
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.reaction.create({
        data: {
          postId: rootPost.id,
          userId: viewerId,
          type: LIKE_TYPE,
        },
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to toggle like", error);
    return NextResponse.json({ error: "FAILED_TO_TOGGLE" }, { status: 500 });
  }

  const likes = await prisma.reaction.count({
    where: { postId: rootPost.id, type: LIKE_TYPE },
  });

  return NextResponse.json({ liked: !existing, likes });
}
