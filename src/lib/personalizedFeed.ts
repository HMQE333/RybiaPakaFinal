import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getVoivodeshipLabel } from "@/const";
import { ensureGalleryTables, resolveAuthorName } from "@/app/api/galeria/_utils";
import { extractTags, parseThreadContent } from "@/app/forum/components/threadContent";

const FEED_LIMIT = 8;
const CANDIDATE_LIMIT = 60;
const ACTIVITY_WINDOW_DAYS = 60;
const ACTIVITY_COUNT_DAYS = 30;
const EXCERPT_LENGTH = 160;

export type PersonalizedFeedUser = {
  id: number;
  label: string;
  email: string;
  region: string | null;
  methods: string[];
};

export type PersonalizedFeedSignals = {
  region: string | null;
  methods: string[];
  recentBoards: string[];
  recentTags: string[];
};

export type PersonalizedFeedActivity = {
  postsLast30: number;
  threadsLast30: number;
  lastActiveAt: string | null;
};

export type FeedThreadItem = {
  id: number;
  title: string;
  excerpt: string;
  createdAt: string;
  board: string | null;
  author: {
    name: string;
    avatarUrl: string | null;
    region: string | null;
  };
  score: number;
  reasons: string[];
};

export type FeedGalleryItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string;
  createdAt: string;
  author: {
    name: string;
    avatarUrl: string | null;
    region: string | null;
  };
  score: number;
  reasons: string[];
};

export type PersonalizedFeedPreview = {
  user: PersonalizedFeedUser;
  signals: PersonalizedFeedSignals;
  activity: PersonalizedFeedActivity;
  threads: FeedThreadItem[];
  gallery: FeedGalleryItem[];
};

const normalize = (value: string) => value.trim().toLowerCase();

const uniqueByNormalized = (values: string[], limit?: number) => {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const key = normalize(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(value);
    if (limit && output.length >= limit) break;
  }
  return output;
};

const buildExcerpt = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  if (normalized.length <= EXCERPT_LENGTH) return normalized;
  return `${normalized.slice(0, EXCERPT_LENGTH).trim()}...`;
};

const scoreRecency = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return 0;
  const days = diffMs / (1000 * 60 * 60 * 24);
  if (days <= 1) return 3;
  if (days <= 7) return 2;
  if (days <= 30) return 1;
  return 0;
};

const collectMatches = (text: string, keywords: string[]) => {
  if (!text || keywords.length === 0) return [] as string[];
  const lower = text.toLowerCase();
  const matches: string[] = [];
  for (const keyword of keywords) {
    const normalized = normalize(keyword);
    if (!normalized) continue;
    if (lower.includes(normalized)) {
      matches.push(keyword);
    }
  }
  return uniqueByNormalized(matches, 3);
};

const pushReason = (reasons: string[], label: string, value?: string | null) => {
  if (reasons.length >= 4) return;
  const suffix = value ? `: ${value}` : "";
  reasons.push(`${label}${suffix}`);
};

const getUserLabel = (user: {
  username?: string | null;
  nick?: string | null;
  name?: string | null;
  email?: string | null;
}) => {
  if (user.username) return user.username;
  if (user.nick) return user.nick;
  if (user.name) return user.name;
  if (user.email) return user.email.split("@")[0] || user.email;
  return "user";
};

const toIso = (value: Date | string) => {
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "";
  return parsed.toISOString();
};

export async function getPersonalizedFeedPreview(
  userId: number
): Promise<PersonalizedFeedPreview | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      nick: true,
      name: true,
      region: { select: { name: true } },
      methods: { select: { method: { select: { name: true } } } },
    },
  });

  if (!user) return null;

  const methodNames = user.methods.map((m) => m.method.name);
  const regionLabel = getVoivodeshipLabel(user.region?.name ?? null);
  const now = Date.now();
  const activitySince = new Date(now - ACTIVITY_WINDOW_DAYS * 86400000);
  const countSince = new Date(now - ACTIVITY_COUNT_DAYS * 86400000);

  const [recentPosts, recentThreads, postsLast30, threadsLast30, lastPost, lastThread] =
    await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: userId,
          deletedAt: null,
          createdAt: { gte: activitySince },
        },
        select: { threadId: true },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.thread.findMany({
        where: { authorId: userId, createdAt: { gte: activitySince } },
        select: { id: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.post.count({
        where: { authorId: userId, deletedAt: null, createdAt: { gte: countSince } },
      }),
      prisma.thread.count({
        where: { authorId: userId, createdAt: { gte: countSince } },
      }),
      prisma.post.findFirst({
        where: { authorId: userId, deletedAt: null },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.thread.findFirst({
        where: { authorId: userId },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const recentThreadIds = uniqueByNormalized(
    [
      ...recentPosts.map((post) => String(post.threadId)),
      ...recentThreads.map((thread) => String(thread.id)),
    ],
    undefined
  ).map((id) => Number(id));

  const recentThreadsDetails = recentThreadIds.length
    ? await prisma.thread.findMany({
        where: { id: { in: recentThreadIds } },
        select: {
          id: true,
          title: true,
          content: true,
          board: { select: { name: true } },
        },
      })
    : [];

  const boardCounts = new Map<string, { name: string; count: number }>();
  const tagCounts = new Map<string, { name: string; count: number }>();

  for (const thread of recentThreadsDetails) {
    const boardName = thread.board?.name?.trim();
    if (boardName) {
      const key = normalize(boardName);
      const existing = boardCounts.get(key);
      boardCounts.set(key, {
        name: boardName,
        count: (existing?.count ?? 0) + 1,
      });
    }

    const parsed = parseThreadContent(thread.content ?? "");
    const tags = extractTags(parsed.meta);
    for (const tag of tags) {
      const key = normalize(tag);
      if (!key) continue;
      const existing = tagCounts.get(key);
      tagCounts.set(key, {
        name: tag,
        count: (existing?.count ?? 0) + 1,
      });
    }
  }

  const recentBoards = [...boardCounts.values()]
    .sort((a, b) => b.count - a.count)
    .map((item) => item.name)
    .slice(0, 4);
  const recentTags = [...tagCounts.values()]
    .sort((a, b) => b.count - a.count)
    .map((item) => item.name)
    .slice(0, 5);

  const lastActiveAt = Math.max(
    lastPost?.createdAt?.getTime?.() ?? 0,
    lastThread?.createdAt?.getTime?.() ?? 0
  );

  const signals: PersonalizedFeedSignals = {
    region: regionLabel,
    methods: methodNames,
    recentBoards,
    recentTags,
  };

  const activity: PersonalizedFeedActivity = {
    postsLast30,
    threadsLast30,
    lastActiveAt: lastActiveAt ? new Date(lastActiveAt).toISOString() : null,
  };

  const keywordMethods = uniqueByNormalized(methodNames, 8);
  const keywordTags = uniqueByNormalized(recentTags, 8);
  const boardSet = new Set(recentBoards.map((board) => normalize(board)));
  const regionKey = user.region?.name ? normalize(user.region.name) : "";

  const threadCandidates = await prisma.thread.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      board: { select: { name: true } },
      author: {
        select: {
          username: true,
          nick: true,
          name: true,
          avatarUrl: true,
          region: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: CANDIDATE_LIMIT,
  });

  await ensureGalleryTables();

  let galleryRows: Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    category: string;
    createdAt: string | Date;
    username: string | null;
    nick: string | null;
    name: string | null;
    avatarUrl: string | null;
    regionName: string | null;
  }> = [];

  try {
    galleryRows = (await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          gi."id" as id,
          gi."title" as title,
          gi."description" as description,
          gi."imageUrl" as imageUrl,
          gi."category" as category,
          gi."createdAt" as createdAt,
          u."username" as username,
          u."nick" as nick,
          u."name" as name,
          u."avatarUrl" as avatarUrl,
          r."name" as regionName
        FROM "GalleryItem" gi
        JOIN "User" u ON u."id" = gi."authorId"
        LEFT JOIN "Region" r ON r."id" = u."regionId"
        WHERE gi."deletedAt" IS NULL
        ORDER BY gi."createdAt" DESC
        LIMIT ${CANDIDATE_LIMIT};
      `
    )) as Array<{
      id: string;
      title: string;
      description: string | null;
      imageUrl: string;
      category: string;
      createdAt: string | Date;
      username: string | null;
      nick: string | null;
      name: string | null;
      avatarUrl: string | null;
      regionName: string | null;
    }>;
  } catch {
    galleryRows = [];
  }

  const scoredThreads = threadCandidates.map((thread) => {
    const text = `${thread.title} ${thread.content ?? ""}`;
    const methodHits = collectMatches(text, keywordMethods);
    const tagHits = collectMatches(text, keywordTags);
    const boardName = thread.board?.name ?? null;
    const boardMatch = boardName
      ? boardSet.has(normalize(boardName))
      : false;
    const authorRegionRaw = thread.author?.region?.name ?? null;
    const regionMatch =
      Boolean(regionKey) &&
      Boolean(authorRegionRaw) &&
      normalize(authorRegionRaw ?? "") === regionKey;
    const recencyScore = scoreRecency(thread.createdAt);

    let score = recencyScore;
    if (boardMatch) score += 3;
    if (methodHits.length > 0) score += 2;
    if (tagHits.length > 0) score += 2;
    if (regionMatch) score += 1;

    const reasons: string[] = [];
    if (boardMatch && boardName) pushReason(reasons, "dział", boardName);
    if (methodHits.length > 0) {
      pushReason(reasons, "metoda", methodHits[0]);
    }
    if (tagHits.length > 0) {
      pushReason(reasons, "tag", tagHits[0]);
    }
    if (regionMatch) {
      pushReason(reasons, "region", regionLabel ?? "");
    }
    if (recencyScore > 0) {
      pushReason(reasons, "świeże");
    }

    return {
      id: thread.id,
      title: thread.title,
      excerpt: buildExcerpt(thread.content ?? ""),
      createdAt: thread.createdAt.toISOString(),
      board: boardName,
      author: {
        name: getUserLabel(thread.author ?? {}),
        avatarUrl: thread.author?.avatarUrl ?? null,
        region: getVoivodeshipLabel(authorRegionRaw),
      },
      score,
      reasons,
    } as FeedThreadItem;
  });

  const scoredGallery = galleryRows.map((item) => {
    const text = `${item.title} ${item.description ?? ""} ${item.category}`;
    const methodHits = collectMatches(text, keywordMethods);
    const tagHits = collectMatches(text, keywordTags);
    const authorRegionRaw = item.regionName;
    const regionMatch =
      Boolean(regionKey) &&
      Boolean(authorRegionRaw) &&
      normalize(authorRegionRaw ?? "") === regionKey;
    const createdAt = new Date(item.createdAt);
    const recencyScore = scoreRecency(createdAt);

    let score = recencyScore;
    if (methodHits.length > 0) score += 2;
    if (tagHits.length > 0) score += 2;
    if (regionMatch) score += 1;

    const reasons: string[] = [];
    if (methodHits.length > 0) {
      pushReason(reasons, "metoda", methodHits[0]);
    }
    if (tagHits.length > 0) {
      pushReason(reasons, "tag", tagHits[0]);
    }
    if (regionMatch) {
      pushReason(reasons, "region", regionLabel ?? "");
    }
    if (recencyScore > 0) {
      pushReason(reasons, "świeże");
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      category: item.category,
      createdAt: toIso(item.createdAt),
      author: {
        name: resolveAuthorName({
          username: item.username,
          nick: item.nick,
          name: item.name,
        }),
        avatarUrl: item.avatarUrl,
        region: getVoivodeshipLabel(authorRegionRaw),
      },
      score,
      reasons,
    } as FeedGalleryItem;
  });

  const threads = scoredThreads
    .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
    .slice(0, FEED_LIMIT);
  const gallery = scoredGallery
    .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
    .slice(0, FEED_LIMIT);

  return {
    user: {
      id: user.id,
      label: getUserLabel(user),
      email: user.email,
      region: regionLabel,
      methods: methodNames,
    },
    signals,
    activity,
    threads,
    gallery,
  };
}

