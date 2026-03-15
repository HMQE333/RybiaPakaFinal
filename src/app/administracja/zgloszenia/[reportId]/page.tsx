import Link from "next/link";
import { notFound } from "next/navigation";

import prisma from "@/lib/prisma";
import type { ReportStatus } from "@/lib/prismaEnums";
import UploadImage from "@/components/UploadImage";

import ReportActions from "./ReportActions";

export const dynamic = "force-dynamic";

function labelStatus(status: ReportStatus) {
  switch (status) {
    case "PENDING":
      return "Nowe";
    case "IN_REVIEW":
      return "W toku";
    case "RESOLVED":
      return "Zamknięte";
    case "REJECTED":
      return "Odrzucone";
    default:
      return status;
  }
}

function badgeStatus(status: ReportStatus) {
  switch (status) {
    case "PENDING":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "IN_REVIEW":
      return "border-blue-500/30 bg-blue-500/10 text-blue-200";
    case "RESOLVED":
      return "border-accent/30 bg-accent/10 text-accent";
    case "REJECTED":
      return "border-red-500/30 bg-red-600/10 text-red-200";
    default:
      return "border-white/10 bg-background-3 text-foreground-2";
  }
}

function userLabel(user?: { username?: string | null; nick?: string | null; email?: string | null } | null) {
  if (!user) return "Anonim";
  const label = user.username || user.nick || user.email;
  return label && label.trim().length > 0 ? label : "Anonim";
}

function formatMaybeDate(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pl-PL");
}

type GalleryItemRow = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string;
  createdAt: string | Date;
  deletedAt: string | Date | null;
  authorId: number;
  username: string | null;
  nick: string | null;
  email: string | null;
  avatarUrl: string | null;
};

type GalleryCommentRow = {
  id: string;
  content: string;
  createdAt: string | Date;
  deletedAt: string | Date | null;
  itemId: string;
  username: string | null;
  nick: string | null;
  email: string | null;
  avatarUrl: string | null;
  itemTitle: string | null;
  itemImageUrl: string | null;
};

async function fetchGalleryItem(targetId: string | null) {
  if (!targetId) return null;
  try {
    const rows = await prisma.$queryRaw<GalleryItemRow[]>`
      SELECT
        gi.id,
        gi.title,
        gi.description,
        gi.imageUrl,
        gi.category,
        gi.createdAt,
        gi.deletedAt,
        gi.authorId,
        u.username,
        u.nick,
        u.email,
        u.avatarUrl
      FROM "GalleryItem" gi
      LEFT JOIN "User" u ON u."id" = gi."authorId"
      WHERE gi.id = ${targetId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchGalleryComment(targetId: string | null) {
  if (!targetId) return null;
  try {
    const rows = await prisma.$queryRaw<GalleryCommentRow[]>`
      SELECT
        gc.id,
        gc.content,
        gc.createdAt,
        gc.deletedAt,
        gc.itemId,
        u.username,
        u.nick,
        u.email,
        u.avatarUrl,
        gi.title as itemTitle,
        gi.imageUrl as itemImageUrl
      FROM "GalleryComment" gc
      LEFT JOIN "User" u ON u."id" = gc."authorId"
      LEFT JOIN "GalleryItem" gi ON gi."id" = gc."itemId"
      WHERE gc.id = ${targetId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const id = String(reportId ?? "").trim();
  if (!id) notFound();

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      reporter: { select: { username: true, nick: true, email: true } },
      handledBy: { select: { username: true, nick: true, email: true } },
    },
  });

  if (!report) notFound();

  const targetType = report.targetType ?? "";
  const targetId = report.targetId ?? "";
  const normalizedType = targetType.toLowerCase();

  const targetUserId = normalizedType === "user" ? Number(targetId) : null;
  const targetPostId = normalizedType === "post" ? Number(targetId) : null;
  const targetThreadId = normalizedType === "thread" ? Number(targetId) : null;
  const targetGalleryItemId = normalizedType === "gallery-item" ? targetId : null;
  const targetGalleryCommentId =
    normalizedType === "gallery-comment" ? targetId : null;

  const [targetUser, targetPost, targetThread, targetGalleryItem, targetGalleryComment] = await Promise.all([
    targetUserId && Number.isInteger(targetUserId) && targetUserId > 0
      ? prisma.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, username: true, nick: true, email: true, role: true },
        })
      : Promise.resolve(null),
    targetPostId && Number.isInteger(targetPostId) && targetPostId > 0
      ? prisma.post.findUnique({
          where: { id: targetPostId },
          select: {
            id: true,
            content: true,
            createdAt: true,
            deletedAt: true,
            author: { select: { username: true, nick: true, email: true } },
            thread: { select: { id: true, title: true } },
          },
        })
      : Promise.resolve(null),
    targetThreadId && Number.isInteger(targetThreadId) && targetThreadId > 0
      ? prisma.thread.findUnique({
          where: { id: targetThreadId },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            deletedAt: true,
            author: { select: { username: true, nick: true, email: true } },
            board: { select: { id: true, name: true } },
          },
        })
      : Promise.resolve(null),
    fetchGalleryItem(targetGalleryItemId),
    fetchGalleryComment(targetGalleryCommentId),
  ]);
  const canDeleteTarget = Boolean(
    (targetPost && !targetPost.deletedAt) ||
      (targetThread && !targetThread.deletedAt) ||
      (targetGalleryItem && !targetGalleryItem.deletedAt) ||
      (targetGalleryComment && !targetGalleryComment.deletedAt)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/administracja/zgloszenia" className="text-sm text-foreground-2 hover:text-foreground">
            ← Wróć do listy
          </Link>
          <h1 className="text-2xl font-semibold">Zgłoszenie</h1>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeStatus(
            report.status as ReportStatus
          )}`}
        >
          {labelStatus(report.status as ReportStatus)}
        </span>
      </div>

      <section className="rounded-2xl border border-white/10 bg-background-2 p-4">
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-sm text-foreground-2">Tytuł</div>
            <div className="text-lg font-semibold">{report.title}</div>
          </div>

          {report.description && (
            <div>
              <div className="text-sm text-foreground-2">Opis</div>
              <div className="whitespace-pre-wrap text-sm text-foreground">
                {report.description}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-background-3 p-3">
              <div className="text-sm text-foreground-2">Kategoria</div>
              <div className="text-sm">{report.category}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-background-3 p-3">
              <div className="text-sm text-foreground-2">Status</div>
              <div className="text-sm">{report.status}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-background-3 p-3">
              <div className="text-sm text-foreground-2">Zgłaszający</div>
              <div className="text-sm">{userLabel(report.reporter)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-background-3 p-3">
              <div className="text-sm text-foreground-2">Obsługujący</div>
              <div className="text-sm">{userLabel(report.handledBy)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-background-3 p-3">
              <div className="text-sm text-foreground-2">Utworzono</div>
              <div className="text-sm">
                {report.createdAt.toLocaleString("pl-PL")}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-background-3 p-3">
              <div className="text-sm text-foreground-2">Zaktualizowano</div>
              <div className="text-sm">
                {report.updatedAt.toLocaleString("pl-PL")}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-sm text-foreground-2">Akcje</div>
            <div className="mt-2">
              <ReportActions
                reportId={report.id}
                status={report.status as ReportStatus}
                canDeleteTarget={canDeleteTarget}
              />
            </div>
          </div>
        </div>
      </section>

      {(targetUser || targetPost || targetThread || targetGalleryItem || targetGalleryComment) && (
        <section className="rounded-2xl border border-white/10 bg-background-2 p-4">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Cel zgłoszenia
          </h2>

          {targetUser && (
            <div className="mt-3 rounded-xl border border-white/10 bg-background-3 p-3 text-sm">
              <div className="text-foreground-2">Użytkownik</div>
              <div className="font-medium">{userLabel(targetUser)}</div>
              <div className="text-foreground-2">Rola: {targetUser.role}</div>
            </div>
          )}

          {targetPost && (
            <div className="mt-3 rounded-xl border border-white/10 bg-background-3 p-3 text-sm">
              <div className="text-foreground-2">
                Post #{targetPost.id} • Autor: {userLabel(targetPost.author)} •{" "}
                {targetPost.createdAt.toLocaleString("pl-PL")}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-foreground">
                {targetPost.content}
              </div>
              {targetPost.thread && (
                <div className="mt-2 text-foreground-2">
                  Wątek: {targetPost.thread.title} (ID: {targetPost.thread.id})
                </div>
              )}
            </div>
          )}

          {targetThread && (
            <div className="mt-3 rounded-xl border border-white/10 bg-background-3 p-3 text-sm">
              <div className="text-foreground-2">
                Wątek #{targetThread.id} • Autor: {userLabel(targetThread.author)}{" "}
                • {targetThread.createdAt.toLocaleString("pl-PL")}
              </div>
              <div className="mt-2 text-lg font-semibold text-foreground">
                {targetThread.title}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-foreground">
                {targetThread.content}
              </div>
              {targetThread.board && (
                <div className="mt-2 text-foreground-2">
                  Dział: {targetThread.board.name} (ID: {targetThread.board.id})
                </div>
              )}
            </div>
          )}

          {targetGalleryItem && (
            <div className="mt-3 rounded-xl border border-white/10 bg-background-3 p-3 text-sm">
              <div className="text-foreground-2">
                Galeria #{targetGalleryItem.id} - Autor:{" "}
                {userLabel({
                  username: targetGalleryItem.username,
                  nick: targetGalleryItem.nick,
                  email: targetGalleryItem.email,
                })}{" "}
                - {formatMaybeDate(targetGalleryItem.createdAt)}
              </div>
              <div className="mt-2 text-base font-semibold text-foreground">
                {targetGalleryItem.title}
              </div>
              {targetGalleryItem.description && (
                <div className="mt-2 whitespace-pre-wrap text-foreground">
                  {targetGalleryItem.description}
                </div>
              )}
              <div className="mt-2 text-foreground-2">
                Kategoria: {targetGalleryItem.category}
              </div>
              <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                <UploadImage
                  src={targetGalleryItem.imageUrl}
                  alt={targetGalleryItem.title || "Zdjęcie w galerii"}
                  loading="lazy"
                  decoding="async"
                  className="h-48 w-full object-cover"
                  fallbackSrc="/artwork/404_post.png"
                />
              </div>
              <div className="mt-2">
                <Link
                  href={`/galeria?zdjecie=${targetGalleryItem.id}`}
                  className="text-accent hover:underline"
                >
                  Otwórz w galerii
                </Link>
              </div>
            </div>
          )}

          {targetGalleryComment && (
            <div className="mt-3 rounded-xl border border-white/10 bg-background-3 p-3 text-sm">
              <div className="text-foreground-2">
                Komentarz #{targetGalleryComment.id} - Autor:{" "}
                {userLabel({
                  username: targetGalleryComment.username,
                  nick: targetGalleryComment.nick,
                  email: targetGalleryComment.email,
                })}{" "}
                - {formatMaybeDate(targetGalleryComment.createdAt)}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-foreground">
                {targetGalleryComment.content}
              </div>
              <div className="mt-2 text-foreground-2">
                Zdjęcie: {targetGalleryComment.itemTitle || "Bez tytułu"} (ID:{" "}
                {targetGalleryComment.itemId})
              </div>
              {targetGalleryComment.itemImageUrl && (
                <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                  <UploadImage
                    src={targetGalleryComment.itemImageUrl}
                    alt={targetGalleryComment.itemTitle || "Zdjęcie w galerii"}
                    loading="lazy"
                    decoding="async"
                    className="h-40 w-full object-cover"
                    fallbackSrc="/artwork/404_post.png"
                  />
                </div>
              )}
              <div className="mt-2">
                <Link
                  href={`/galeria?zdjecie=${targetGalleryComment.itemId}`}
                  className="text-accent hover:underline"
                >
                  Otwórz w galerii
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

