import { NextRequest, NextResponse } from "next/server";

import { getViewerFromHeaders, isAdminRole } from "@/lib/adminAccess";
import prisma from "@/lib/prisma";
import { ensureGalleryTables } from "../../_utils";

export const dynamic = "force-dynamic";

async function markGalleryCommentTreeDeleted(
  commentId: string,
  deletedAt: Date
) {
  await prisma.$executeRaw`
    WITH RECURSIVE descendants(id) AS (
      SELECT "id" FROM "GalleryComment" WHERE "id" = ${commentId}
      UNION ALL
      SELECT gc."id" FROM "GalleryComment" gc
      JOIN descendants d ON gc."parentId" = d."id"
    )
    UPDATE "GalleryComment" SET "deletedAt" = ${deletedAt}
    WHERE "id" IN (SELECT id FROM descendants);
  `;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { commentId: string } | Promise<{ commentId: string }> }
) {
  await ensureGalleryTables();

  const { commentId: rawCommentId } = await params;
  const commentId = String(rawCommentId ?? "").trim();
  if (!commentId) {
    return NextResponse.json({ error: "INVALID_COMMENT" }, { status: 400 });
  }

  const viewer = await getViewerFromHeaders(req.headers);
  if (!viewer) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const rows = await prisma.$queryRaw<
    Array<{ id: string; authorId: number; deletedAt: string | Date | null }>
  >`
    SELECT "id", "authorId", "deletedAt"
    FROM "GalleryComment"
    WHERE "id" = ${commentId}
    LIMIT 1;
  `;

  const comment = rows[0];
  if (!comment || comment.deletedAt) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isAdmin = isAdminRole(viewer.role);
  if (comment.authorId !== viewer.id && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const deletedAt = new Date();
    await markGalleryCommentTreeDeleted(commentId, deletedAt);
    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete gallery comment", error);
    return NextResponse.json({ error: "FAILED_TO_DELETE" }, { status: 500 });
  }
}
