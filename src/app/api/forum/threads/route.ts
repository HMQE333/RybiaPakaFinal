import { NextRequest, NextResponse } from "next/server";

import { getViewerFromHeaders, isAdminRole } from "@/lib/adminAccess";
import prisma from "@/lib/prisma";
import {
  ensureRootPost,
  isArchivedBoardName,
  resolveAuthorName,
  resolveAvatarUrl,
  resolveBoardId,
  resolveSessionUserId,
} from "../_utils";
import { VALID_EMOJI_IDS } from "@/lib/forumEmojis";

const MAX_TITLE_LENGTH = 140;
const MAX_CONTENT_LENGTH = 5_000;
const LIKE_TYPE = "LIKE";

export const dynamic = "force-dynamic";

type ThreadAuthor = {
  id: number;
  username: string | null;
  nick: string | null;
  name: string | null;
  avatarUrl: string | null;
  image: string | null;
};

type ThreadRow = {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: Date;
  board: { id: number; name: string } | null;
  author: ThreadAuthor | null;
};

function sanitizeText(input: string, maxLength: number) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function serializeThread(
  thread: ThreadRow,
  meta: {
    comments: number;
    likes: number;
    liked: boolean;
    canDelete: boolean;
    canEdit: boolean;
    canArchive: boolean;
    archived: boolean;
    reactionCounts: Record<string, number>;
    myReactions: string[];
  }
) {
  const author = thread.author;
  return {
    id: thread.id,
    title: thread.title,
    content: thread.content,
    createdAt: thread.createdAt.toISOString(),
    board: thread.board ? { id: thread.board.id, name: thread.board.name } : null,
    author: author
      ? {
          id: author.id,
          name: resolveAuthorName(author),
          avatar: resolveAvatarUrl(author.avatarUrl, author.image),
        }
      : null,
    comments: meta.comments,
    likes: meta.likes,
    liked: meta.liked,
    canDelete: meta.canDelete,
    canEdit: meta.canEdit,
    canArchive: meta.canArchive,
    archived: meta.archived,
    reactionCounts: meta.reactionCounts,
    myReactions: meta.myReactions,
  };
}

export async function GET(req: NextRequest) {
  const viewer = await getViewerFromHeaders(req.headers);
  const viewerId = viewer?.id ?? null;
  const isAdmin = viewer ? isAdminRole(viewer.role) : false;

  const threads = await prisma.thread.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      board: true,
      author: {
        select: {
          id: true,
          username: true,
          nick: true,
          name: true,
          avatarUrl: true,
          image: true,
        },
      },
    },
  });

  if (threads.length === 0) {
    return NextResponse.json({
      threads: [],
      viewer: { authenticated: Boolean(viewerId) },
    });
  }

  const threadIds = threads.map((thread) => thread.id);
  const rootPosts = await prisma.post.findMany({
    where: { threadId: { in: threadIds }, parentId: null, deletedAt: null },
    select: { id: true, threadId: true },
  });

  const rootByThread = new Map<number, number>();
  rootPosts.forEach((root) => rootByThread.set(root.threadId, root.id));

  const missingThreadIds = threadIds.filter((id) => !rootByThread.has(id));
  if (missingThreadIds.length > 0) {
    const createdRoots = await Promise.all(
      missingThreadIds.map((threadId) => ensureRootPost(threadId))
    );
    createdRoots.forEach((root) => {
      if (root) rootByThread.set(root.threadId, root.id);
    });
  }

  const commentCounts = await prisma.post.groupBy({
    by: ["threadId"],
    where: {
      threadId: { in: threadIds },
      parentId: { not: null },
      deletedAt: null,
    },
    _count: { _all: true },
  });

  const commentsByThread = new Map<number, number>();
  commentCounts.forEach((row) => {
    commentsByThread.set(row.threadId, row._count._all);
  });

  const rootIds = Array.from(new Set(rootByThread.values()));
  const emojiTypes = Array.from(VALID_EMOJI_IDS);

  const [likeReactions, emojiReactions] =
    rootIds.length > 0
      ? await Promise.all([
          prisma.reaction.findMany({
            where: { postId: { in: rootIds }, type: LIKE_TYPE },
            select: { postId: true, userId: true },
          }),
          prisma.reaction.findMany({
            where: { postId: { in: rootIds }, type: { in: emojiTypes } },
            select: { postId: true, userId: true, type: true },
          }),
        ])
      : [[], []];

  const likesByPost = new Map<number, number>();
  const likedPosts = new Set<number>();

  likeReactions.forEach((reaction) => {
    likesByPost.set(reaction.postId, (likesByPost.get(reaction.postId) ?? 0) + 1);
    if (viewerId && reaction.userId === viewerId) {
      likedPosts.add(reaction.postId);
    }
  });

  const emojiCountsByPost = new Map<number, Record<string, number>>();
  const myEmojisByPost = new Map<number, string[]>();

  emojiReactions.forEach((reaction) => {
    const counts = emojiCountsByPost.get(reaction.postId) ?? {};
    counts[reaction.type] = (counts[reaction.type] ?? 0) + 1;
    emojiCountsByPost.set(reaction.postId, counts);
    if (viewerId && reaction.userId === viewerId) {
      const mine = myEmojisByPost.get(reaction.postId) ?? [];
      mine.push(reaction.type);
      myEmojisByPost.set(reaction.postId, mine);
    }
  });

  const payload = threads.map((thread) => {
    const rootId = rootByThread.get(thread.id);
    const likes = rootId ? likesByPost.get(rootId) ?? 0 : 0;
    const liked = rootId ? likedPosts.has(rootId) : false;
    const comments = commentsByThread.get(thread.id) ?? 0;
    const canDelete = Boolean(viewerId) && (thread.authorId === viewerId || isAdmin);
    const canEdit = Boolean(viewerId) && thread.authorId === viewerId;
    const canArchive = Boolean(viewerId) && thread.authorId === viewerId;
    const archived = isArchivedBoardName(thread.board?.name);
    const reactionCounts = rootId ? (emojiCountsByPost.get(rootId) ?? {}) : {};
    const myReactions = rootId ? (myEmojisByPost.get(rootId) ?? []) : [];
    return serializeThread(thread, {
      comments,
      likes,
      liked,
      canDelete,
      canEdit,
      canArchive,
      archived,
      reactionCounts,
      myReactions,
    });
  });

  return NextResponse.json({
    threads: payload,
    viewer: { authenticated: Boolean(viewerId) },
  });
}

export async function POST(req: NextRequest) {
  const viewerId = await resolveSessionUserId(req);
  if (!viewerId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const title = sanitizeText(String(body?.title ?? ""), MAX_TITLE_LENGTH);
  const content = sanitizeText(String(body?.content ?? ""), MAX_CONTENT_LENGTH);
  const tag = sanitizeText(
    String(body?.tag ?? body?.board ?? body?.category ?? ""),
    80
  );

  if (!title || !content) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const boardId = await resolveBoardId(tag);

  try {
    const thread = await prisma.thread.create({
      data: {
        title,
        content,
        boardId,
        authorId: viewerId,
        posts: {
          create: {
            content,
            authorId: viewerId,
            parentId: null,
          },
        },
      },
      include: {
        board: true,
        author: {
          select: {
            id: true,
            username: true,
            nick: true,
            name: true,
            avatarUrl: true,
            image: true,
          },
        },
      },
    });

  const payload = serializeThread(thread, {
    comments: 0,
    likes: 0,
    liked: false,
    canDelete: true,
    canEdit: true,
    canArchive: true,
    archived: false,
    reactionCounts: {},
    myReactions: [],
  });

    return NextResponse.json({ thread: payload }, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create forum thread", error);
    return NextResponse.json({ error: "FAILED_TO_CREATE" }, { status: 500 });
  }
}
