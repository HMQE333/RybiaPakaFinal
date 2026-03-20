"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Send, ThumbsUp, MoreHorizontal, Trash2 } from "lucide-react";
import { formatTimeAgo } from "./time";
import { handleUploadImageError } from "@/lib/imageFallback";

interface Comment {
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
}

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string, parentId?: number | null) => Promise<boolean>;
  onLikeComment: (commentId: number) => void;
  onDeleteComment?: (commentId: number) => void;
  displayCount?: number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  canComment?: boolean;
  commentDisabledReason?: string;
  hideComposer?: boolean;
}

const MENTION_REGEX = /@([a-zA-Z0-9_.-]{1,32})/g;

export default function CommentSection({
  comments,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  displayCount,
  isLoading,
  error,
  onRetry,
  canComment = true,
  commentDisabledReason,
  hideComposer = false,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [knownMentions, setKnownMentions] = useState<Record<string, boolean>>(
    {}
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingMentions = useRef(new Set<string>());
  const visibleCount = displayCount ?? comments.length;
  const shouldShowComposer = !hideComposer;

  const replyTarget = useMemo(() => {
    if (!replyTo) return null;
    const findComment = (items: Comment[]): Comment | null => {
      for (const item of items) {
        if (item.id === replyTo) return item;
        if (item.replies?.length) {
          const found = findComment(item.replies);
          if (found) return found;
        }
      }
      return null;
    };
    return findComment(comments);
  }, [comments, replyTo]);

  const mentionCandidates = useMemo(() => {
    const names = new Set<string>();
    const collect = (items: Comment[]) => {
      items.forEach((comment) => {
        const regex = new RegExp(MENTION_REGEX.source, "g");
        let match: RegExpExecArray | null;
        while ((match = regex.exec(comment.content)) !== null) {
          if (match[1]) {
            names.add(match[1]);
          }
        }
        if (comment.replies?.length) {
          collect(comment.replies);
        }
      });
    };
    collect(comments);
    return Array.from(names);
  }, [comments]);

  useEffect(() => {
    let active = true;
    const missing = mentionCandidates.filter(
      (name) =>
        knownMentions[name] === undefined &&
        !pendingMentions.current.has(name)
    );
    if (missing.length === 0) return;

    missing.forEach((name) => pendingMentions.current.add(name));

    missing.forEach((name) => {
      fetch(`/api/profile/${encodeURIComponent(name)}`, { cache: "no-store" })
        .then((res) => {
          if (!active) return;
          setKnownMentions((prev) => ({ ...prev, [name]: res.ok }));
        })
        .catch(() => {
          if (!active) return;
          setKnownMentions((prev) => ({ ...prev, [name]: false }));
        })
        .finally(() => {
          pendingMentions.current.delete(name);
        });
    });

    return () => {
      active = false;
    };
  }, [mentionCandidates, knownMentions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting || !canComment) return;

    setIsSubmitting(true);
    let success = false;

    try {
      success = await onAddComment(newComment, replyTo ?? null);
    } finally {
      setIsSubmitting(false);
    }

    if (success) {
      setNewComment("");
      setReplyTo(null);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyTo(comment.id);
    setNewComment((prev) => {
      const mention = `@${comment.author} `;
      if (prev.startsWith(mention)) return prev;
      return `${mention}${prev}`;
    });
    inputRef.current?.focus();
  };

  const renderContent = (text: string) => {
    const regex = new RegExp(MENTION_REGEX.source, "g");
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const handle = match[1];
      const token = `@${handle}`;
      if (start > lastIndex) {
        parts.push(text.slice(lastIndex, start));
      }
      if (knownMentions[handle]) {
        parts.push(
          <span key={`${start}-${handle}`} className="text-accent font-semibold">
            {token}
          </span>
        );
      } else {
        parts.push(token);
      }
      lastIndex = start + token.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const isReply = depth > 0;
    const wrapperClass = isReply
      ? "flex gap-3 rounded-xl border border-white/10 bg-background-3/50 p-3 group"
      : "flex gap-3 group";
    const avatarClass = isReply ? "w-7 h-7" : "w-8 h-8";

    return (
      <div key={comment.id} className="space-y-3">
        <div className={wrapperClass}>
          <img
            src={comment.avatar}
            alt={comment.author}
            loading="lazy"
            decoding="async"
            className={`${avatarClass} rounded-full bg-background-2`}
            onError={(event) =>
              handleUploadImageError(
                event.currentTarget,
                "/artwork/avatar_default.svg"
              )
            }
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {comment.author}
              </span>
              <span className="text-xs text-foreground-2">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>

            <p className="text-sm text-foreground leading-relaxed mt-1">
              {renderContent(comment.content)}
            </p>

            <div className="flex items-center gap-3 mt-2 text-xs text-foreground-2">
              <button
                onClick={() => onLikeComment(comment.id)}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors interactive-press"
                aria-pressed={comment.liked}
              >
                <ThumbsUp
                  size={14}
                  className={comment.liked ? "text-accent animate-like" : ""}
                />
                <span>{comment.likes > 0 ? comment.likes : "Lubię to"}</span>
              </button>
              <button
                onClick={() => handleReply(comment)}
                className="hover:text-foreground transition-colors interactive-press"
              >
                Odpowiedz
              </button>
              {comment.canDelete && onDeleteComment && (
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className="flex items-center gap-1 text-foreground-2 hover:text-red-300 transition-colors interactive-press"
                  aria-label="Usuń komentarz"
                >
                  <Trash2 size={14} />
                  <span>Usuń</span>
                </button>
              )}
              <button
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-foreground-2 transition-all interactive-press"
                aria-label="Więcej opcji"
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-10 space-y-3">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <h3 className="text-base font-semibold text-foreground mb-4">
        Komentarze ({visibleCount})
      </h3>

      {error && (
        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-white/10 bg-background-3/70 px-4 py-3 text-sm text-foreground-2">
          <span>{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="self-start text-accent hover:underline"
            >
              Spróbuj ponownie
            </button>
          )}
        </div>
      )}

      {!canComment && !error && (
        <div className="mb-4 rounded-lg border border-white/10 bg-background-3/70 px-4 py-3 text-sm text-foreground-2">
          {commentDisabledReason ?? "Zaloguj się, aby dodać komentarz."}
        </div>
      )}

      {isLoading && comments.length === 0 && (
        <p className="mb-4 text-sm text-foreground-2">Ładowanie komentarzy...</p>
      )}

      {!isLoading && comments.length === 0 && !error && (
        <p className="mb-4 text-sm text-foreground-2">
          Brak komentarzy. Dodaj pierwszy!
        </p>
      )}

      {shouldShowComposer && (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <img
            src="/artwork/avatar_default.svg"
            alt="Gość"
            loading="lazy"
            decoding="async"
            className="w-9 h-9 rounded-full bg-background-2"
          />
          <div className="flex-1">
            {replyTarget && (
              <div className="mb-2 flex items-center gap-2 text-xs text-foreground-2">
                <span>Odpowiadasz do</span>
                <span className="text-accent">@{replyTarget.author}</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-foreground-2 hover:text-foreground transition-colors"
                >
                  Anuluj
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 bg-background-3 border border-white/10 rounded-lg px-3">
              <input
                ref={inputRef}
                type="text"
                placeholder="Napisz komentarz..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting || !canComment}
                className="w-full bg-transparent py-2 text-sm text-foreground placeholder:text-foreground-2 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting || !canComment}
                className="p-1.5 text-accent hover:bg-accent/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors interactive-press"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-5">
        {comments.map((comment) => renderComment(comment))}
      </div>
    </div>
  );
}



