"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Archive,
  Trash2,
  Pencil,
} from "lucide-react";
import CommentSection from "./CommentSection";
import { formatTimeAgo } from "./time";
import { extractTags, filterMeta } from "./threadContent";
import { handleUploadImageError } from "@/lib/imageFallback";

type Post = {
  id: number;
  author: string;
  avatar: string;
  createdAt: string;
  title: string;
  content: string;
  meta?: { label: string; value: string }[];
  pollOptions?: string[];
  likes: number;
  liked?: boolean;
  comments: number;
  canDelete?: boolean;
  canEdit?: boolean;
  canArchive?: boolean;
  archived?: boolean;
};

type Comment = {
  id: number;
  author: string;
  avatar: string;
  createdAt: string;
  content: string;
  likes: number;
  liked?: boolean;
  parentId?: number | null;
  replies?: Comment[];
  canDelete?: boolean;
};

interface PostDetailModalProps {
  post: Post | null;
  comments: Comment[];
  commentsLoading?: boolean;
  commentsError?: string | null;
  onRetryComments?: () => void;
  onClose: () => void;
  onToggleLike: (postId: number) => void;
  onShare: (post: Post) => void;
  onAddComment: (content: string, parentId?: number | null) => Promise<boolean>;
  onLikeComment: (commentId: number) => void;
  onDeleteComment?: (commentId: number) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  canComment?: boolean;
  viewerAvatar?: string | null;
}

export default function PostDetailModal({
  post,
  comments,
  commentsLoading,
  commentsError,
  onRetryComments,
  onClose,
  onToggleLike,
  onShare,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  onDelete,
  onEdit,
  onArchive,
  canComment,
  viewerAvatar,
}: PostDetailModalProps) {
  const postId = post?.id ?? null;
  const metaSource = post?.meta ?? [];
  const pollOptions = post?.pollOptions ?? [];
  const pollKey = postId ? `forum_poll_vote_${postId}` : "";
  const displayedCommentsCount = post
    ? Math.max(post.comments, comments.length)
    : comments.length;
  const timeAgo = post ? formatTimeAgo(post.createdAt) : "";
  const metaItems = useMemo(() => filterMeta(metaSource), [metaSource]);
  const tags = useMemo(() => extractTags(metaSource), [metaSource]);
  const [pollVote, setPollVote] = useState<number | null>(null);
  const isArchived = Boolean(post?.archived);

  const linkValue = useMemo(() => {
    const linkItem = metaSource.find((item) =>
      item.label.toLowerCase().startsWith("link")
    );
    return linkItem?.value ?? "";
  }, [metaSource]);

  useEffect(() => {
    if (!postId) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [postId]);

  useEffect(() => {
    if (!postId || pollOptions.length < 2) {
      setPollVote(null);
      return;
    }
    try {
      const stored = window.localStorage.getItem(pollKey);
      if (stored == null) {
        setPollVote(null);
        return;
      }
      const parsed = Number(stored);
      if (Number.isInteger(parsed) && parsed >= 0) {
        setPollVote(parsed);
      } else {
        setPollVote(null);
      }
    } catch {
      setPollVote(null);
    }
  }, [pollKey, pollOptions.length, postId]);

  const handlePollVote = (index: number) => {
    if (!postId || pollVote !== null) return;
    setPollVote(index);
    try {
      window.localStorage.setItem(pollKey, String(index));
    } catch {
      // ignore
    }
  };

  if (!post) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3/95 via-background-2/95 to-background-3/90 shadow-[0_20px_80px_rgba(0,0,0,0.45)] flex flex-col modal-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(0,206,0,0.14),transparent_35%)]" />
        <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_80%_10%,rgba(0,150,255,0.12),transparent_35%)]" />

        <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10 bg-background-2/70 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-foreground-2 transition-colors interactive-press"
              aria-label="Zamknij dyskusję"
            >
              <X size={18} />
            </button>
            <span className="text-sm font-semibold text-foreground">
              Dyskusja
            </span>
          </div>
          <div className="flex items-center gap-2">
            {post.canEdit && onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-white/10 rounded-full text-foreground-2 transition-colors interactive-press"
                aria-label="Edytuj wątek"
              >
                <Pencil size={18} />
              </button>
            )}
            {post.canArchive && onArchive && !isArchived && (
              <button
                onClick={onArchive}
                className="p-2 hover:bg-white/10 rounded-full text-foreground-2 transition-colors interactive-press"
                aria-label="Archiwizuj wątek"
              >
                <Archive size={18} />
              </button>
            )}
            {post.canDelete && onDelete && (
              <button
                onClick={onDelete}
                className="p-2 hover:bg-white/10 rounded-full text-foreground-2 transition-colors interactive-press"
                aria-label="Usuń wątek"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              className="p-2 hover:bg-white/10 rounded-full text-foreground-2 transition-colors interactive-press"
              aria-label="Więcej opcji"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">
          <div className="flex items-center gap-3">
            <img
              src={post.avatar}
              alt={post.author}
              loading="lazy"
              decoding="async"
              className="w-10 h-10 rounded-full object-cover bg-background-2"
              onError={(event) =>
                handleUploadImageError(
                  event.currentTarget,
                  "/artwork/avatar_default.svg"
                )
              }
            />
            <div>
              <h3 className="text-sm font-semibold text-accent">
                {post.author}
              </h3>
              <span className="text-xs text-foreground-2">{timeAgo}</span>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-foreground">{post.title}</h2>

          {(metaItems.length > 0 || tags.length > 0 || linkValue) && (
            <div className="rounded-2xl border border-white/10 bg-background-3/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground-2 uppercase tracking-wide">
                  Metryka wątku
                </h4>
                {linkValue && (
                  <a
                    href={linkValue}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="text-xs text-accent hover:underline"
                  >
                    Link
                  </a>
                )}
              </div>
              {metaItems.length > 0 && (
                <div className="space-y-1 text-xs text-foreground-2">
                  {metaItems.map((item) => (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
                    >
                      <span className="text-foreground-2">
                        {item.label}:
                      </span>
                      <span className="text-foreground">
                        {item.value || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div className="text-xs text-foreground-2">
                  <span className="text-foreground-2">Tagi:</span>{" "}
                  <span className="text-foreground">
                    {tags.map((tag) => `#${tag}`).join(" ")}
                  </span>
                </div>
              )}
            </div>
          )}

          {pollOptions.length >= 2 && (
            <div className="rounded-2xl border border-white/10 bg-background-3/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground-2 uppercase tracking-wide">
                  Ankieta
                </h4>
                {pollVote !== null && (
                  <span className="text-xs text-foreground-2">
                    Głos zapisany
                  </span>
                )}
              </div>
              <div className="space-y-2" role="radiogroup" aria-label="Ankieta">
                {pollOptions.map((option, index) => {
                  const selected = pollVote === index;
                  return (
                    <button
                      key={`${option}-${index}`}
                      type="button"
                      onClick={() => handlePollVote(index)}
                      disabled={pollVote !== null}
                      aria-pressed={selected}
                      className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm text-left transition-colors interactive-press ${
                        selected
                          ? "border-accent/60 bg-accent/10 text-foreground"
                          : "border-white/10 bg-background-4/60 text-foreground-2 hover:border-white/20"
                      }`}
                    >
                      <span className="text-foreground">{option}</span>
                      {selected && (
                        <span className="text-xs text-accent">Wybrano</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {post.content && (
            <div className="rounded-2xl border border-white/10 bg-background-3/60 p-5">
              <p className="text-foreground-2 text-base leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 py-3 border-t border-b border-white/10 text-xs text-foreground-2">
            <button
              onClick={() => onToggleLike(post.id)}
              className="flex items-center gap-2 hover:text-accent transition-colors interactive-press"
              aria-pressed={post.liked}
            >
              <Heart
                size={18}
                className={post.liked ? "text-accent animate-like" : ""}
                fill={post.liked ? "currentColor" : "none"}
              />
              <span>{post.likes} polubień</span>
            </button>
            <button className="flex items-center gap-2 hover:text-blue-400 transition-colors interactive-press">
              <MessageSquare size={18} />
              <span>{displayedCommentsCount} komentarzy</span>
            </button>
            <button
              onClick={() => onShare(post)}
              className="flex items-center gap-2 hover:text-green-400 transition-colors interactive-press"
            >
              <Share2 size={18} />
              <span>Udostępnij</span>
            </button>
          </div>

          <CommentSection
            comments={comments}
            onAddComment={onAddComment}
            onLikeComment={onLikeComment}
            onDeleteComment={onDeleteComment}
            displayCount={displayedCommentsCount}
            isLoading={commentsLoading}
            error={commentsError}
            onRetry={onRetryComments}
            canComment={canComment}
            commentDisabledReason={
              isArchived
                ? "Wątek zarchiwizowany. Odpowiedzi są wyłączone."
                : undefined
            }
            hideComposer={isArchived}
            viewerAvatar={viewerAvatar}
          />
        </div>
      </div>
    </div>
  );
}
