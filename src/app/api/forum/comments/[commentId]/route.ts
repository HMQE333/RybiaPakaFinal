import { NextRequest, NextResponse } from "next/server";

import { getViewerFromHeaders, isAdminRole } from "@/lib/adminAccess";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseCommentId(raw: string) {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

async function markPostTreeDeleted(postId: number, deletedAt: Date) {
  await prisma.$executeRaw`
    WITH RECURSIVE descendants(id) AS (
      SELECT "id" FROM "Post" WHERE "id" = ${postId}
      UNION ALL
      SELECT p."id" FROM "Post" p
      JOIN descendants d ON p."parentId" = d."id"
    )
    UPDATE "Post" SET "deletedAt" = ${deletedAt}
    WHERE "id" IN (SELECT id FROM descendants);
  `;
}

export async function DELETE(
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
    select: { id: true, authorId: true, parentId: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "COMMENT_NOT_FOUND" }, { status: 404 });
  }
  if (!comment.parentId) {
    return NextResponse.json({ error: "INVALID_COMMENT" }, { status: 400 });
  }

  const viewer = await getViewerFromHeaders(req.headers);
  if (!viewer) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const isAdmin = isAdminRole(viewer.role);
  if (comment.authorId !== viewer.id && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const deletedAt = new Date();
    await markPostTreeDeleted(commentId, deletedAt);
    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete comment", error);
    return NextResponse.json({ error: "FAILED_TO_DELETE" }, { status: 500 });
  }
}
