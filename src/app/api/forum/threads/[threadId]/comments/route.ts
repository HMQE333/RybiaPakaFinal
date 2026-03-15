import { NextRequest, NextResponse } from "next/server";

import { getViewerFromHeaders, isAdminRole } from "@/lib/adminAccess";
import prisma from "@/lib/prisma";
import {
  ensureRootPost,
  isArchivedBoardName,
  resolveAuthorName,
  resolveAvatarUrl,
  resolveSessionUserId,
} from "../../../_utils";

const MAX_CONTENT_LENGTH = 3_000;
const LIKE_TYPE = "LIKE";

export const dynamic = "force-dynamic";

type CommentAuthor = {
  id: number;
  username: string | null;
  nick: string | null;
  name: string | null;
  avatarUrl: string | null;
};

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

function serializeComment(
  comment: {
    id: number;
    authorId: number;
    content: string;
    createdAt: Date;
    parentId: number | null;
    author: CommentAuthor | null;
    reactions?: { userId: number }[];
  },
  viewerId: number,
  viewerIsAdmin: boolean
) {
  const reactions = comment.reactions ?? [];
  const likes = reactions.length;
  const liked = reactions.some((reaction) => reaction.userId === viewerId);
  const author = comment.author;

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    parentId: comment.parentId,
    author: author
      ? {
          id: author.id,
          name: resolveAuthorName(author),
          avatar: resolveAvatarUrl(author.avatarUrl),
        }
      : null,
    likes,
    liked,
    canDelete: viewerIsAdmin || comment.authorId === viewerId,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } | Promise<{ threadId: string }> }
) {
  const viewer = await getViewerFromHeaders(req.headers);
  if (!viewer) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const viewerId = viewer.id;
  const viewerIsAdmin = isAdminRole(viewer.role);

  const { threadId: rawThreadId } = await params;
  const threadId = parseThreadId(rawThreadId);
  if (!threadId) {
    return NextResponse.json({ error: "INVALID_THREAD" }, { status: 400 });
  }

  const exists = await prisma.thread.findFirst({
    where: { id: threadId, deletedAt: null },
    select: { id: true },
  });

  if (!exists) {
    return NextResponse.json({ error: "THREAD_NOT_FOUND" }, { status: 404 });
  }

  const comments = await prisma.post.findMany({
    where: { threadId, parentId: { not: null }, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      authorId: true,
      content: true,
      createdAt: true,
      parentId: true,
      author: {
        select: {
          id: true,
          username: true,
          nick: true,
          name: true,
          avatarUrl: true,
        },
      },
      reactions: {
        where: { type: LIKE_TYPE },
        select: { userId: true },
      },
    },
  });

  return NextResponse.json({
    comments: comments.map((comment) =>
      serializeComment(comment, viewerId, viewerIsAdmin)
    ),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } | Promise<{ threadId: string }> }
) {
  const viewerId = await resolveSessionUserId(req);
  if (!viewerId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { threadId: rawThreadId } = await params;
  const threadId = parseThreadId(rawThreadId);
  if (!threadId) {
    return NextResponse.json({ error: "INVALID_THREAD" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const content = sanitizeText(
    String(body?.content ?? body?.message ?? ""),
    MAX_CONTENT_LENGTH
  );
  const rawParentId = body?.parentId;
  let requestedParentId: number | null = null;
  if (rawParentId !== undefined && rawParentId !== null && rawParentId !== "") {
    const parsedParent = Number(rawParentId);
    if (!Number.isInteger(parsedParent) || parsedParent <= 0) {
      return NextResponse.json({ error: "INVALID_PARENT" }, { status: 400 });
    }
    requestedParentId = parsedParent;
  }

  if (!content) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const thread = await prisma.thread.findFirst({
    where: { id: threadId, deletedAt: null },
    select: { id: true, board: { select: { name: true } } },
  });

  if (!thread) {
    return NextResponse.json({ error: "THREAD_NOT_FOUND" }, { status: 404 });
  }

  if (isArchivedBoardName(thread.board?.name)) {
    return NextResponse.json({ error: "THREAD_ARCHIVED" }, { status: 403 });
  }

  const rootPost = await ensureRootPost(threadId);

  if (!rootPost) {
    return NextResponse.json({ error: "THREAD_NOT_FOUND" }, { status: 404 });
  }

  let parentId = rootPost.id;
  if (requestedParentId) {
    const parent = await prisma.post.findFirst({
      where: { id: requestedParentId, threadId, deletedAt: null },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json({ error: "INVALID_PARENT" }, { status: 400 });
    }
    parentId = parent.id;
  }

  try {
    const comment = await prisma.post.create({
      data: {
        content,
        threadId,
        authorId: viewerId,
        parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nick: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          parentId: comment.parentId,
          author: comment.author
            ? {
                id: comment.author.id,
                name: resolveAuthorName(comment.author),
                avatar: resolveAvatarUrl(comment.author.avatarUrl),
              }
            : null,
          likes: 0,
          liked: false,
          canDelete: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create comment", error);
    return NextResponse.json({ error: "FAILED_TO_CREATE" }, { status: 500 });
  }
}
