import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getVoivodeshipLabel } from "@/const";
import { getRandomDefaultAvatar } from "@/lib/avatarDefaults";

export type Profile = {
  id: number;
  username: string;
  age: number | null;
  ageRange: string | null;
  pronouns: string | null;
  bannerUrl: string | null;
  avatar?: string;
  methods: string[];
  postsCount: number;
  commentsCount: number;
  messagesCount: number;
  voivodeship: string | null;
  rank: string;
  joinedAt: string; // ISO
  bio?: string | null;
  status?: "online" | "offline";
};

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    region: true;
    rank: true;
    methods: { include: { method: true } };
  };
}>;

async function buildProfile(user: UserWithRelations): Promise<Profile> {
  const [postsCount, commentsCount, sentCount, recvCount] = await Promise.all([
    prisma.post.count({
      where: { authorId: user.id, parentId: null, deletedAt: null },
    }),
    prisma.post.count({
      where: { authorId: user.id, NOT: { parentId: null }, deletedAt: null },
    }),
    prisma.message.count({ where: { senderId: user.id } }),
    prisma.message.count({ where: { receiverId: user.id } }),
  ]);

  const ensureAvatarUrl = async () => {
    const trimmed = typeof user.avatarUrl === "string" ? user.avatarUrl.trim() : "";
    if (trimmed) return trimmed;
    const fallback = getRandomDefaultAvatar();
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: fallback },
      });
    } catch {
      // Keep fallback for response even if update fails.
    }
    return fallback;
  };

  const avatarUrl = await ensureAvatarUrl();

  const methods = user.methods.map((um) => um.method.name);

  return {
    id: user.id,
    username: user.username ?? user.nick ?? user.name ?? "",
    age: user.age ?? null,
    ageRange: user.ageRange ?? null,
    pronouns: user.pronouns ?? null,
    bannerUrl: user.bannerUrl ?? null,
    avatar: avatarUrl || undefined,
    methods,
    postsCount,
    commentsCount,
    messagesCount: sentCount + recvCount,
    voivodeship: getVoivodeshipLabel(user.region?.name ?? null),
    rank: user.rank?.name ?? "",
    joinedAt: (user.joinedAt ?? user.createdAt).toISOString(),
    bio: user.bio ?? null,
    status: "offline",
  };
}

const profileInclude = {
  region: true,
  rank: true,
  methods: { include: { method: true } },
} satisfies Prisma.UserInclude;

export async function getUser(usernameOrNick: string): Promise<Profile | null> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: usernameOrNick },
        { nick: usernameOrNick },
        { name: usernameOrNick },
      ],
    },
    include: profileInclude,
  });

  if (!user) {
    return null;
  }

  return buildProfile(user);
}

export async function getUserByEmail(email: string): Promise<Profile | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    include: profileInclude,
  });

  if (!user) {
    return null;
  }

  return buildProfile(user);
}

export async function getUserById(userId: number): Promise<Profile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: profileInclude,
  });

  if (!user) {
    return null;
  }

  return buildProfile(user);
}
