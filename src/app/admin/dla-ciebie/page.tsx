import Link from "next/link";
import {
  LucideCompass,
  LucideImages,
  LucideMessageSquare,
  LucideUsers,
  LucideMessageCircle,
  LucideActivity,
} from "lucide-react";

import prisma from "@/lib/prisma";
import UploadImage from "@/components/UploadImage";
import { ensureGalleryTables } from "@/app/api/galeria/_utils";
import { ensureChannelMessageTable } from "@/app/api/dyskusje/messages/_utils";
import { getPersonalizedFeedPreview } from "@/lib/personalizedFeed";
import UserSelect from "./UserSelect";

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatAverage = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "-";
  return value.toFixed(1).replace(".", ",");
};
const formatCount = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "-";
  return value.toLocaleString("pl-PL");
};

const toNumber = (value: number | bigint | null | undefined) => {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return 0;
};

const toIso = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString();
};

type GallerySummary = {
  items: number;
  comments: number;
  likes: number;
  commentLikes: number;
  itemsLastWindow: number;
  commentsLastWindow: number;
  lastItemAt: string | null;
  lastCommentAt: string | null;
};

type UserStatsSummary = {
  threads: number;
  posts: number;
  reactions: number;
  directMessages: number;
  chatMessages: number;
  galleryItems: number;
  galleryComments: number;
};

async function fetchGallerySummary(statsSince: Date): Promise<GallerySummary> {
  try {
    await ensureGalleryTables();
    const rows = await prisma.$queryRaw<
      Array<{
        items: number | bigint | null;
        comments: number | bigint | null;
        likes: number | bigint | null;
        commentLikes: number | bigint | null;
        itemsLastWindow: number | bigint | null;
        commentsLastWindow: number | bigint | null;
        lastItemAt: string | Date | null;
        lastCommentAt: string | Date | null;
      }>
    >`
      SELECT
        (SELECT COUNT(*) FROM "GalleryItem" WHERE "deletedAt" IS NULL) AS items,
        (SELECT COUNT(*) FROM "GalleryComment" WHERE "deletedAt" IS NULL) AS comments,
        (SELECT COUNT(*) FROM "GalleryLike") AS likes,
        (SELECT COUNT(*) FROM "GalleryCommentLike") AS commentLikes,
        (SELECT COUNT(*) FROM "GalleryItem" WHERE "deletedAt" IS NULL AND "createdAt" >= ${statsSince}) AS itemsLastWindow,
        (SELECT COUNT(*) FROM "GalleryComment" WHERE "deletedAt" IS NULL AND "createdAt" >= ${statsSince}) AS commentsLastWindow,
        (SELECT "createdAt" FROM "GalleryItem" WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1) AS lastItemAt,
        (SELECT "createdAt" FROM "GalleryComment" WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1) AS lastCommentAt;
    `;
    const row = rows[0] ?? {};
    return {
      items: toNumber(row.items),
      comments: toNumber(row.comments),
      likes: toNumber(row.likes),
      commentLikes: toNumber(row.commentLikes),
      itemsLastWindow: toNumber(row.itemsLastWindow),
      commentsLastWindow: toNumber(row.commentsLastWindow),
      lastItemAt: toIso(row.lastItemAt),
      lastCommentAt: toIso(row.lastCommentAt),
    };
  } catch {
    return {
      items: 0,
      comments: 0,
      likes: 0,
      commentLikes: 0,
      itemsLastWindow: 0,
      commentsLastWindow: 0,
      lastItemAt: null,
      lastCommentAt: null,
    };
  }
}

async function fetchGalleryUserSummary(userId: number) {
  try {
    await ensureGalleryTables();
    const rows = await prisma.$queryRaw<
      Array<{
        items: number | bigint | null;
        comments: number | bigint | null;
      }>
    >`
      SELECT
        (SELECT COUNT(*) FROM "GalleryItem" WHERE "deletedAt" IS NULL AND "authorId" = ${userId}) AS items,
        (SELECT COUNT(*) FROM "GalleryComment" WHERE "deletedAt" IS NULL AND "authorId" = ${userId}) AS comments;
    `;
    const row = rows[0] ?? {};
    return {
      items: toNumber(row.items),
      comments: toNumber(row.comments),
    };
  } catch {
    return { items: 0, comments: 0 };
  }
}

async function fetchUserStats(userId: number): Promise<UserStatsSummary> {
  await ensureChannelMessageTable();
  const [threads, posts, reactions, directMessages, chatMessages, gallery] =
    await Promise.all([
      prisma.thread.count({ where: { authorId: userId, deletedAt: null } }),
      prisma.post.count({ where: { authorId: userId, deletedAt: null } }),
      prisma.reaction.count({ where: { userId } }),
      prisma.message.count({ where: { senderId: userId } }),
      prisma.channelMessage.count({ where: { authorId: userId } }),
      fetchGalleryUserSummary(userId),
    ]);

  return {
    threads,
    posts,
    reactions,
    directMessages,
    chatMessages,
    galleryItems: gallery.items,
    galleryComments: gallery.comments,
  };
}

const buildUserLabel = (user: {
  username: string | null;
  nick: string | null;
  email: string;
}) => user.username || user.nick || user.email.split("@")[0] || user.email;

const GENERAL_STATS_WINDOW_DAYS = 30;

export default async function PersonalizedFeedAdminPage({
  searchParams,
}: {
  searchParams?: { user?: string };
}) {
  const rawUserId = searchParams?.user ?? "";
  const parsedUserId = Number(rawUserId);
  const selectedUserId = Number.isInteger(parsedUserId) && parsedUserId > 0
    ? parsedUserId
    : null;

  const users = await prisma.user.findMany({
    select: { id: true, username: true, nick: true, email: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const userOptions = users.map((user) => ({
    id: user.id,
    label: buildUserLabel(user),
    email: user.email,
  }));

  const statsSince = new Date(Date.now() - GENERAL_STATS_WINDOW_DAYS * 86400000);

  await ensureChannelMessageTable();

  const [
    totalUsers,
    newUsersLastWindow,
    totalThreads,
    totalPosts,
    totalReactions,
    totalDirectMessages,
    totalChatMessages,
    postsLastWindow,
    threadsLastWindow,
    chatMessagesLastWindow,
    lastPost,
    lastThread,
    lastChatMessage,
    lastDirectMessage,
    gallerySummary,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: statsSince } } }),
    prisma.thread.count({ where: { deletedAt: null } }),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.reaction.count(),
    prisma.message.count(),
    prisma.channelMessage.count(),
    prisma.post.count({
      where: { deletedAt: null, createdAt: { gte: statsSince } },
    }),
    prisma.thread.count({
      where: { deletedAt: null, createdAt: { gte: statsSince } },
    }),
    prisma.channelMessage.count({ where: { createdAt: { gte: statsSince } } }),
    prisma.post.findFirst({
      where: { deletedAt: null },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.thread.findFirst({
      where: { deletedAt: null },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.channelMessage.findFirst({
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.findFirst({
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    fetchGallerySummary(statsSince),
  ]);

  const galleryItemTime = gallerySummary.lastItemAt
    ? new Date(gallerySummary.lastItemAt).getTime()
    : 0;
  const galleryCommentTime = gallerySummary.lastCommentAt
    ? new Date(gallerySummary.lastCommentAt).getTime()
    : 0;

  const platformLastActiveAt = Math.max(
    lastPost?.createdAt?.getTime?.() ?? 0,
    lastThread?.createdAt?.getTime?.() ?? 0,
    lastChatMessage?.createdAt?.getTime?.() ?? 0,
    lastDirectMessage?.createdAt?.getTime?.() ?? 0,
    galleryItemTime,
    galleryCommentTime
  );

  const generalStats = {
    totals: {
      users: totalUsers,
      threads: totalThreads,
      posts: totalPosts,
      reactions: totalReactions,
      directMessages: totalDirectMessages,
      chatMessages: totalChatMessages,
      galleryItems: gallerySummary.items,
      galleryComments: gallerySummary.comments,
      galleryLikes: gallerySummary.likes + gallerySummary.commentLikes,
    },
    window: {
      newUsers: newUsersLastWindow,
      posts: postsLastWindow,
      threads: threadsLastWindow,
      chatMessages: chatMessagesLastWindow,
      galleryItems: gallerySummary.itemsLastWindow,
      galleryComments: gallerySummary.commentsLastWindow,
    },
    averages: {
      posts: totalUsers > 0 ? postsLastWindow / totalUsers : null,
      threads: totalUsers > 0 ? threadsLastWindow / totalUsers : null,
      galleryItems:
        totalUsers > 0 ? gallerySummary.itemsLastWindow / totalUsers : null,
      galleryComments:
        totalUsers > 0 ? gallerySummary.commentsLastWindow / totalUsers : null,
    },
    lastActiveAt: platformLastActiveAt
      ? new Date(platformLastActiveAt).toISOString()
      : null,
    lastGalleryItemAt: gallerySummary.lastItemAt,
    lastGalleryCommentAt: gallerySummary.lastCommentAt,
    lastChatAt: lastChatMessage?.createdAt
      ? lastChatMessage.createdAt.toISOString()
      : null,
  };

  const userStats = selectedUserId ? await fetchUserStats(selectedUserId) : null;
  const preview = selectedUserId
    ? await getPersonalizedFeedPreview(selectedUserId)
    : null;

  const hasSelection = Boolean(selectedUserId);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Statystyki feedu</h1>
        <p className="text-sm text-foreground-2">
          Podgląd personalizowanego feedu na podstawie zainteresowań i historii
          aktywności użytkownika. Bez wyboru pokazujemy średnie z całej
          platformy.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-background-3 via-background-2 to-background-3 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <LucideActivity size={18} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-3">
                Panel statystyk
              </p>
              <h2 className="text-lg font-semibold text-foreground">
                Wybór użytkownika
              </h2>
            </div>
          </div>

          <form
            method="get"
            className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"
          >
            <UserSelect users={userOptions} selectedUserId={selectedUserId} />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent transition hover:bg-accent/20"
            >
              <LucideCompass size={14} />
              Pokaż statystyki
            </button>
          </form>
          <p className="text-xs text-foreground-2">
            Lista pokazuje 50 ostatnio aktywnych kont. Zmień użytkownika, aby
            sprawdzić, jak feed reaguje na jego historię.
          </p>
        </div>
      </section>

      {!preview && hasSelection && (
        <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          Nie znaleziono wybranego użytkownika. Spróbuj ponownie.
        </section>
      )}

      {!preview && !hasSelection && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              Ogólne statystyki
            </h2>
            <span className="text-xs text-foreground-2">
              Średnia z {generalStats.totals.users} użytkowników
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
              <div className="flex items-center justify-between text-foreground-2">
                <p className="text-[11px] uppercase tracking-[0.2em]">Użytkownicy</p>
                <LucideUsers size={16} className="text-accent" />
              </div>
              <div className="mt-3 text-2xl font-semibold text-foreground">
                {formatCount(generalStats.totals.users)}
              </div>
              <div className="mt-2 text-xs text-foreground-2">
                Nowi (30 dni): {formatCount(generalStats.window.newUsers)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
              <div className="flex items-center justify-between text-foreground-2">
                <p className="text-[11px] uppercase tracking-[0.2em]">Forum</p>
                <LucideMessageSquare size={16} className="text-accent" />
              </div>
              <div className="mt-3 space-y-2 text-sm text-foreground-2">
                <div>
                  Wątki: <span className="text-foreground">{formatCount(generalStats.totals.threads)}</span>
                </div>
                <div>
                  Posty: <span className="text-foreground">{formatCount(generalStats.totals.posts)}</span>
                </div>
                <div>
                  Reakcje: <span className="text-foreground">{formatCount(generalStats.totals.reactions)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
              <div className="flex items-center justify-between text-foreground-2">
                <p className="text-[11px] uppercase tracking-[0.2em]">Galeria</p>
                <LucideImages size={16} className="text-accent" />
              </div>
              <div className="mt-3 space-y-2 text-sm text-foreground-2">
                <div>
                  Zdjęcia: <span className="text-foreground">{formatCount(generalStats.totals.galleryItems)}</span>
                </div>
                <div>
                  Komentarze: <span className="text-foreground">{formatCount(generalStats.totals.galleryComments)}</span>
                </div>
                <div>
                  Polubienia: <span className="text-foreground">{formatCount(generalStats.totals.galleryLikes)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
              <div className="flex items-center justify-between text-foreground-2">
                <p className="text-[11px] uppercase tracking-[0.2em]">Wiadomości</p>
                <LucideMessageCircle size={16} className="text-accent" />
              </div>
              <div className="mt-3 space-y-2 text-sm text-foreground-2">
                <div>
                  DM: <span className="text-foreground">{formatCount(generalStats.totals.directMessages)}</span>
                </div>
                <div>
                  Czat: <span className="text-foreground">{formatCount(generalStats.totals.chatMessages)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Średnia aktywności (ostatnie {GENERAL_STATS_WINDOW_DAYS} dni)
              </h3>
              <div className="mt-3 space-y-2 text-sm text-foreground-2">
                <div>
                  Posty na użytkownika: <span className="text-foreground">{formatAverage(generalStats.averages.posts)}</span>
                </div>
                <div>
                  Wątki na użytkownika: <span className="text-foreground">{formatAverage(generalStats.averages.threads)}</span>
                </div>
                <div>
                  Zdjęcia na użytkownika: <span className="text-foreground">{formatAverage(generalStats.averages.galleryItems)}</span>
                </div>
                <div>
                  Komentarze galerii na użytkownika:{" "}
                  <span className="text-foreground">{formatAverage(generalStats.averages.galleryComments)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Aktywność {GENERAL_STATS_WINDOW_DAYS} dni
              </h3>
              <div className="mt-3 space-y-2 text-sm text-foreground-2">
                <div>Posty łącznie: {formatCount(generalStats.window.posts)}</div>
                <div>Wątki łącznie: {formatCount(generalStats.window.threads)}</div>
                <div>Czat łącznie: {formatCount(generalStats.window.chatMessages)}</div>
                <div>Zdjęcia galerii: {formatCount(generalStats.window.galleryItems)}</div>
                <div>Komentarze galerii: {formatCount(generalStats.window.galleryComments)}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Ostatnia aktywność
              </h3>
              <div className="mt-3 space-y-2 text-sm text-foreground-2">
                <div>Ostatni ruch: {formatDateTime(generalStats.lastActiveAt)}</div>
                <div>
                  Ostatnie zdjęcie: {formatDateTime(generalStats.lastGalleryItemAt)}
                </div>
                <div>
                  Ostatni czat: {formatDateTime(generalStats.lastChatAt)}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {preview && (
        <div className="space-y-6">
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
              <h2 className="text-sm font-semibold text-foreground">Profil</h2>
              <div className="mt-3 space-y-2 text-sm text-foreground-2">
                <div>
                  <span className="text-foreground">@{preview.user.label}</span>
                </div>
                <div>{preview.user.email}</div>
                <div>Region: {preview.user.region ?? "brak"}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {preview.user.methods.length > 0 ? (
                  preview.user.methods.map((method) => (
                    <span
                      key={method}
                      className="rounded-full border border-white/10 bg-background-3 px-2 py-0.5 text-[11px] text-foreground-2"
                    >
                      {method}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-foreground-2">
                    Brak metod wędkowania.
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
              <h2 className="text-sm font-semibold text-foreground">Sygnały</h2>
              <div className="mt-3 space-y-3 text-xs text-foreground-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-foreground-3">
                    Ostatnie działy
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {preview.signals.recentBoards.length > 0 ? (
                      preview.signals.recentBoards.map((board) => (
                        <span
                          key={board}
                          className="rounded-full border border-white/10 bg-background-3 px-2 py-0.5"
                        >
                          {board}
                        </span>
                      ))
                    ) : (
                      <span>Brak aktywności w wątkach.</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-foreground-3">
                    Tagi z aktywności
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {preview.signals.recentTags.length > 0 ? (
                      preview.signals.recentTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-background-3 px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span>Brak tagów z historii.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
              <h2 className="text-sm font-semibold text-foreground">Aktywność</h2>
              <div className="mt-3 space-y-2 text-sm text-foreground-2">
                <div>Posty (30 dni): {preview.activity.postsLast30}</div>
                <div>Wątki (30 dni): {preview.activity.threadsLast30}</div>
                <div>
                  Ostatnia aktywność: {formatDateTime(preview.activity.lastActiveAt)}
                </div>
              </div>
            </div>
          </section>

          {userStats && (
            <section className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
                <div className="flex items-center justify-between text-foreground-2">
                  <p className="text-[11px] uppercase tracking-[0.2em]">Podsumowanie</p>
                  <LucideActivity size={16} className="text-accent" />
                </div>
                <div className="mt-3 space-y-2 text-sm text-foreground-2">
                  <div>
                    Wątki: <span className="text-foreground">{formatCount(userStats.threads)}</span>
                  </div>
                  <div>
                    Posty: <span className="text-foreground">{formatCount(userStats.posts)}</span>
                  </div>
                  <div>
                    Reakcje: <span className="text-foreground">{formatCount(userStats.reactions)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
                <div className="flex items-center justify-between text-foreground-2">
                  <p className="text-[11px] uppercase tracking-[0.2em]">Wiadomości</p>
                  <LucideMessageCircle size={16} className="text-accent" />
                </div>
                <div className="mt-3 space-y-2 text-sm text-foreground-2">
                  <div>
                    DM: <span className="text-foreground">{formatCount(userStats.directMessages)}</span>
                  </div>
                  <div>
                    Czat: <span className="text-foreground">{formatCount(userStats.chatMessages)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
                <div className="flex items-center justify-between text-foreground-2">
                  <p className="text-[11px] uppercase tracking-[0.2em]">Galeria</p>
                  <LucideImages size={16} className="text-accent" />
                </div>
                <div className="mt-3 space-y-2 text-sm text-foreground-2">
                  <div>
                    Zdjęcia: <span className="text-foreground">{formatCount(userStats.galleryItems)}</span>
                  </div>
                  <div>
                    Komentarze: <span className="text-foreground">{formatCount(userStats.galleryComments)}</span>
                  </div>
                </div>
              </div>
            </section>
          )}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                Proponowany feed
              </h2>
              <span className="text-xs text-foreground-2">
                {preview.threads.length + preview.gallery.length} elementów
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground-2">
                  <LucideMessageSquare size={14} className="text-accent" />
                  Forum
                </div>
                <div className="mt-4 space-y-3">
                  {preview.threads.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-background-3 p-3 text-xs text-foreground-2">
                      Brak rekomendacji forum.
                    </div>
                  ) : (
                    preview.threads.map((thread) => (
                      <Link
                        key={thread.id}
                        href={`/forum?watek=${thread.id}`}
                        className="group block rounded-xl border border-white/10 bg-background-3/60 p-3 transition-colors hover:border-accent/40"
                      >
                        <div className="flex items-center justify-between text-[11px] text-foreground-2">
                          <span>{thread.board ?? "Forum"}</span>
                          <span>{formatDate(thread.createdAt)}</span>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-foreground group-hover:text-accent">
                          {thread.title}
                        </div>
                        {thread.excerpt && (
                          <p className="mt-1 text-xs text-foreground-2 line-clamp-2">
                            {thread.excerpt}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground-2">
                          <span>Score: {thread.score}</span>
                          {thread.reasons.length > 0 ? (
                            thread.reasons.map((reason) => (
                              <span
                                key={`${thread.id}-${reason}`}
                                className="rounded-full border border-white/10 bg-background-4/60 px-2 py-0.5"
                              >
                                {reason}
                              </span>
                            ))
                          ) : (
                            <span>Brak dopasowania</span>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-background-2 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground-2">
                  <LucideImages size={14} className="text-accent" />
                  Galeria
                </div>
                <div className="mt-4 space-y-3">
                  {preview.gallery.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-background-3 p-3 text-xs text-foreground-2">
                      Brak rekomendacji galerii.
                    </div>
                  ) : (
                    preview.gallery.map((item) => (
                      <Link
                        key={item.id}
                        href={`/galeria?zdjecie=${encodeURIComponent(item.id)}`}
                        className="group block rounded-xl border border-white/10 bg-background-3/60 p-3 transition-colors hover:border-accent/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-20 overflow-hidden rounded-lg border border-white/10 bg-background-4/60">
                            <UploadImage
                              src={item.imageUrl}
                              alt={item.title}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                              fallbackSrc="/artwork/404_post.png"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-[11px] text-foreground-2">
                              <span>{item.category}</span>
                              <span>{formatDate(item.createdAt)}</span>
                            </div>
                            <div className="mt-1 text-sm font-semibold text-foreground group-hover:text-accent">
                              {item.title}
                            </div>
                            <div className="text-xs text-foreground-2">
                              Autor: {item.author.name}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground-2">
                          <span>Score: {item.score}</span>
                          {item.reasons.length > 0 ? (
                            item.reasons.map((reason) => (
                              <span
                                key={`${item.id}-${reason}`}
                                className="rounded-full border border-white/10 bg-background-4/60 px-2 py-0.5"
                              >
                                {reason}
                              </span>
                            ))
                          ) : (
                            <span>Brak dopasowania</span>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}









