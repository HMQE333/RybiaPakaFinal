import React from "react";
import {
  MessageSquare,
  Heart,
  Share2,
  MoreHorizontal,
  Tag,
  Trash2,
} from "lucide-react";
import { handleUploadImageError } from "@/lib/imageFallback";
import ForumReactionBar from "./ForumReactionBar";

interface PostCardProps {
  id: number;
  author: string;
  avatar: string;
  timeAgo: string;
  title: string;
  content: string;
  meta?: { label: string; value: string }[];
  pollOptions?: string[];
  likes: number;
  comments: number;
  liked?: boolean;
  tag?: string;
  canDelete?: boolean;
  reactionCounts?: Record<string, number>;
  myReactions?: string[];
  authenticated?: boolean;
  onClick: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMore?: () => void;
  onDelete?: () => void;
}

export default function PostCard({
  id,
  author,
  avatar,
  timeAgo,
  title,
  content,
  meta,
  pollOptions,
  likes,
  comments,
  liked,
  tag,
  canDelete,
  reactionCounts = {},
  myReactions = [],
  authenticated = false,
  onClick,
  onLike,
  onComment,
  onShare,
  onMore,
  onDelete,
}: PostCardProps) {
  const metaItems = (meta ?? []).filter(
    (item) =>
      item.value &&
      !item.label.toLowerCase().startsWith("tag") &&
      !item.label.toLowerCase().startsWith("link")
  );
  const metaPreview = metaItems.slice(0, 2);
  const extraMeta = metaItems.length - metaPreview.length;
  const pollCount = pollOptions?.length ?? 0;
  const showMeta =
    metaPreview.length > 0 || extraMeta > 0 || pollCount >= 2;

  const hasReactions = Object.values(reactionCounts).some((c) => c > 0);

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-background-3/90 via-background-2/90 to-background-3/80 p-5 shadow-[0_12px_50px_rgba(0,0,0,0.35)] transition-all hover:border-white/20 interactive-card"
    >
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_15%_20%,rgba(0,206,0,0.12),transparent_45%)]" />
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_85%_15%,rgba(0,150,255,0.12),transparent_50%)]" />
      <div className="relative flex items-start gap-4">
        <img
          src={avatar}
          alt={author}
          loading="lazy"
          decoding="async"
          className="w-12 h-12 rounded-full object-cover bg-background-2 border border-white/10"
          onError={(event) =>
            handleUploadImageError(
              event.currentTarget,
              "/artwork/avatar_default.svg"
            )
          }
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-2">
              <span className="font-semibold text-accent">{author}</span>
              <span>• {timeAgo}</span>
              {tag && (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
                  <Tag size={12} /> {tag}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {canDelete && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-2 hover:bg-white/10 rounded-full text-foreground-2 transition-colors interactive-press"
                  aria-label="Usuń wątek"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMore?.();
                }}
                className="p-2 hover:bg-white/10 rounded-full text-foreground-2 transition-colors interactive-press"
                aria-label="Więcej opcji"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          <h3 className="mt-2 text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
            {title}
          </h3>

          {content && (
            <p className="mt-2 text-sm text-foreground-2 leading-relaxed line-clamp-2">
              {content}
            </p>
          )}

          {showMeta && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-2">
              {metaPreview.map((item) => (
                <span key={`${item.label}-${item.value}`}>
                  <span className="text-foreground-2">{item.label}:</span>{" "}
                  <span className="text-foreground">{item.value}</span>
                </span>
              ))}
              {extraMeta > 0 && <span>+{extraMeta} więcej</span>}
              {pollCount >= 2 && <span>Ankieta: {pollCount} opcji</span>}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-foreground-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className="flex items-center gap-1.5 hover:text-accent transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-accent/10 interactive-press"
              aria-pressed={liked}
            >
              <Heart
                size={16}
                className={liked ? "text-accent animate-like" : ""}
                fill={liked ? "currentColor" : "none"}
              />
              <span>{likes}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComment();
              }}
              className="flex items-center gap-1.5 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-blue-400/10 interactive-press"
            >
              <MessageSquare size={16} />
              <span>{comments} komentarzy</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="flex items-center gap-1.5 hover:text-green-400 transition-colors p-1.5 rounded-lg hover:bg-green-400/10 interactive-press"
            >
              <Share2 size={16} />
              <span>Udostępnij</span>
            </button>
          </div>

          {(hasReactions || authenticated) && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <ForumReactionBar
                threadId={id}
                initialCounts={reactionCounts}
                initialMine={myReactions}
                authenticated={authenticated}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
