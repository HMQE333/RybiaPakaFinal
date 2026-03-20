import { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type AuthorShape = {
  id: number;
  username: string | null;
  nick: string | null;
  name: string | null;
  avatarUrl: string | null;
  image?: string | null;
};

const DEFAULT_AVATAR = "/artwork/404_user.png";
const GUEST_EMAIL = "guest@rybiapaka.local";
const GUEST_NAME = "Gość";
const GUEST_NICK = "gosc";
const ARCHIVE_BOARD_NAME = "Archiwum";

export function resolveAuthorName(author?: AuthorShape | null) {
  if (!author) return GUEST_NAME;
  return author.username || author.nick || author.name || GUEST_NAME;
}

export function resolveAvatarUrl(avatarUrl?: string | null, image?: string | null) {
  return avatarUrl || image || DEFAULT_AVATAR;
}

export function isArchivedBoardName(name?: string | null) {
  if (!name) return false;
  return name.trim().toLowerCase() === ARCHIVE_BOARD_NAME.toLowerCase();
}

export async function resolveSessionUserId(req: NextRequest) {
  try {
    const session = await auth.api
      .getSession({ headers: req.headers })
      .catch(() => null);
    const parsed = Number(session?.user?.id ?? "");
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export async function ensureGuestUserId() {
  const existing = await prisma.user.findUnique({
    where: { email: GUEST_EMAIL },
  });
  if (existing) return existing.id;

  const nickTaken = await prisma.user.findFirst({
    where: { nick: GUEST_NICK },
  });
  const usernameTaken = await prisma.user.findFirst({
    where: { username: GUEST_NICK },
  });

  try {
    const created = await prisma.user.create({
      data: {
        email: GUEST_EMAIL,
        name: GUEST_NAME,
        emailVerified: true,
        nick: nickTaken ? null : GUEST_NICK,
        username: usernameTaken ? null : GUEST_NICK,
      },
    });
    return created.id;
  } catch {
    const retry = await prisma.user.findUnique({
      where: { email: GUEST_EMAIL },
    });
    if (retry) return retry.id;
    throw new Error("FAILED_TO_CREATE_GUEST");
  }
}

export async function resolveBoardId(rawName?: string | null) {
  const name = (rawName ?? "Ogólne").trim() || "Ogólne";
  const existing = await prisma.board.findFirst({ where: { name } });
  if (existing) return existing.id;

  const created = await prisma.board.create({
    data: { name: name.slice(0, 80) },
  });
  return created.id;
}

export async function ensureRootPost(threadId: number) {
  const root = await prisma.post.findFirst({
    where: { threadId, parentId: null, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (root) return root;

  const thread = await prisma.thread.findFirst({
    where: { id: threadId, deletedAt: null },
    select: { content: true, authorId: true },
  });
  if (!thread) return null;

  return prisma.post.create({
    data: {
      content: thread.content,
      threadId,
      authorId: thread.authorId,
      parentId: null,
    },
  });
}

export type { AuthorShape };
export { ARCHIVE_BOARD_NAME };
