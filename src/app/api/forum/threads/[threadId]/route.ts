import { NextRequest, NextResponse } from "next/server";

import { getViewerFromHeaders, isAdminRole } from "@/lib/adminAccess";
import prisma from "@/lib/prisma";
import {
  ARCHIVE_BOARD_NAME,
  isArchivedBoardName,
  resolveBoardId,
} from "../../_utils";

export const dynamic = "force-dynamic";

const MAX_TITLE_LENGTH = 140;
const MAX_CONTENT_LENGTH = 5_000;

function parseThreadId(raw: string) {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function sanitizeText(input: string, maxLength: number) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { threadId: string } | Promise<{ threadId: string }> }
) {
  const { threadId: rawThreadId } = await params;
  const threadId = parseThreadId(rawThreadId);
  if (!threadId) {
    return NextResponse.json({ error: "INVALID_THREAD" }, { status: 400 });
  }

  const thread = await prisma.thread.findFirst({
    where: { id: threadId, deletedAt: null },
    select: { authorId: true },
  });

  if (!thread) {
    return NextResponse.json({ error: "THREAD_NOT_FOUND" }, { status: 404 });
  }

  const viewer = await getViewerFromHeaders(req.headers);
  if (!viewer) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const isAdmin = isAdminRole(viewer.role);
  if (thread.authorId !== viewer.id && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    await prisma.thread.delete({ where: { id: threadId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete thread", error);
    return NextResponse.json({ error: "FAILED_TO_DELETE" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { threadId: string } | Promise<{ threadId: string }> }
) {
  const { threadId: rawThreadId } = await params;
  const threadId = parseThreadId(rawThreadId);
  if (!threadId) {
    return NextResponse.json({ error: "INVALID_THREAD" }, { status: 400 });
  }

  const thread = await prisma.thread.findFirst({
    where: { id: threadId, deletedAt: null },
    select: {
      id: true,
      title: true,
      content: true,
      authorId: true,
      boardId: true,
      board: { select: { id: true, name: true } },
    },
  });

  if (!thread) {
    return NextResponse.json({ error: "THREAD_NOT_FOUND" }, { status: 404 });
  }

  const viewer = await getViewerFromHeaders(req.headers);
  if (!viewer) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let body: any = null;
  if (contentType.includes("application/json")) {
    try {
      body = await req.json();
    } catch {
      body = null;
    }
  }

  const requestedTitle = body?.title ?? null;
  const requestedContent = body?.content ?? null;
  const requestedTag = body?.tag ?? body?.board ?? null;
  const hasEditPayload =
    requestedTitle !== null ||
    requestedContent !== null ||
    requestedTag !== null;

  if (hasEditPayload) {
    if (thread.authorId !== viewer.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    if (isArchivedBoardName(thread.board?.name)) {
      return NextResponse.json({ error: "THREAD_ARCHIVED" }, { status: 403 });
    }

    const title = sanitizeText(
      String(requestedTitle ?? thread.title ?? ""),
      MAX_TITLE_LENGTH
    );
    const content = sanitizeText(
      String(requestedContent ?? thread.content ?? ""),
      MAX_CONTENT_LENGTH
    );
    const tag = sanitizeText(String(requestedTag ?? ""), 80);

    if (!title || !content) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const boardId = tag ? await resolveBoardId(tag) : thread.boardId;

    try {
      const updated = await prisma.thread.update({
        where: { id: threadId },
        data: {
          title,
          content,
          boardId,
          posts: {
            updateMany: {
              where: { parentId: null, deletedAt: null },
              data: { content },
            },
          },
        },
        include: { board: true },
      });

      return NextResponse.json({
        thread: {
          id: updated.id,
          title: updated.title,
          content: updated.content,
          board: updated.board
            ? { id: updated.board.id, name: updated.board.name }
            : null,
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to update thread", error);
      return NextResponse.json({ error: "FAILED_TO_UPDATE" }, { status: 500 });
    }
  }

  if (thread.authorId !== viewer.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (isArchivedBoardName(thread.board?.name)) {
    return NextResponse.json({
      success: true,
      archived: true,
      board: { name: ARCHIVE_BOARD_NAME },
    });
  }

  try {
    const archiveBoardId = await resolveBoardId(ARCHIVE_BOARD_NAME);
    const updated = await prisma.thread.update({
      where: { id: threadId },
      data: { boardId: archiveBoardId },
      include: { board: true },
    });

    return NextResponse.json({
      success: true,
      archived: true,
      board: updated.board
        ? { id: updated.board.id, name: updated.board.name }
        : { name: ARCHIVE_BOARD_NAME },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to archive thread", error);
    return NextResponse.json({ error: "FAILED_TO_ARCHIVE" }, { status: 500 });
  }
}
