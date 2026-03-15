import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { resolveSessionUserId } from "../../../_utils";

const LIKE_TYPE = "LIKE";

export const dynamic = "force-dynamic";

function parseCommentId(raw: string) {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { commentId: string } | Promise<{ commentId: string }> }
) {
  const { commentId: rawCommentId } = await params;
  const commentId = parseCommentId(rawCommentId);
  if (!commentId) {
    return NextResponse.json({ error: "INVALID_COMMENT" }, { status: 400 });
  }

  const comment = await prisma.post.findFirst({
    where: { id: commentId, deletedAt: null },
    select: { id: true, parentId: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "COMMENT_NOT_FOUND" }, { status: 404 });
  }

  if (comment.parentId === null) {
    return NextResponse.json({ error: "INVALID_COMMENT" }, { status: 400 });
  }

  const viewerId = await resolveSessionUserId(req);
  if (!viewerId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const existing = await prisma.reaction.findUnique({
    where: {
      postId_userId_type: {
        postId: comment.id,
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
          postId: comment.id,
          userId: viewerId,
          type: LIKE_TYPE,
        },
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to toggle comment like", error);
    return NextResponse.json({ error: "FAILED_TO_TOGGLE" }, { status: 500 });
  }

  const likes = await prisma.reaction.count({
    where: { postId: comment.id, type: LIKE_TYPE },
  });

  return NextResponse.json({ liked: !existing, likes });
}
