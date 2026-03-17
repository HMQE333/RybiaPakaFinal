"use client";

import type { ReactNode, RefObject } from "react";
import Image from "next/image";
import { Eye, EyeOff, MoreVertical } from "lucide-react";

import type { ChannelMessage } from "../types";
import { handleUploadImageError } from "@/lib/imageFallback";

type ChatMessageListProps = {
  listRef: RefObject<HTMLDivElement | null>;
  loading: boolean;
  accessDenied: boolean;
  messages: ChannelMessage[];
  isAdminViewer: boolean;
  openMenuId: string | null;
  adminActionId: string | null;
  revealedMessageIds: Record<string, boolean>;
  fallbackAvatar: string;
  formatTimestamp: (iso: string) => string;
  renderMessageText: (text: string) => ReactNode;
  onToggleMenu: (id: string | null) => void;
  onHideMessage: (message: ChannelMessage, nextHidden: boolean) => void;
  onDeleteMessage: (messageId: string) => void;
  onToggleReveal: (messageId: string) => void;
  hasOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
};

export default function ChatMessageList({
  listRef,
  loading,
  accessDenied,
  messages,
  isAdminViewer,
  openMenuId,
  adminActionId,
  revealedMessageIds,
  fallbackAvatar,
  formatTimestamp,
  renderMessageText,
  onToggleMenu,
  onHideMessage,
  onDeleteMessage,
  onToggleReveal,
  hasOlder,
  loadingOlder,
  onLoadOlder,
}: ChatMessageListProps) {
  return (
    <div
      ref={listRef}
      className="custom-scrollbar relative flex-1 min-h-0 space-y-4 overflow-y-auto px-5 py-4"
    >
      {!loading && hasOlder && (
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={loadingOlder}
            className="rounded-xl border border-white/10 bg-background-4/60 px-4 py-2 text-xs text-foreground-2 transition hover:border-accent/30 hover:text-foreground disabled:opacity-50"
          >
            {loadingOlder ? "Ładuję starsze..." : "Załaduj starsze wiadomości"}
          </button>
        </div>
      )}
      {loading ? (
        <div className="rounded-xl border border-white/10 bg-background-4/60 px-4 py-3 text-sm text-foreground-2">
          Ładuję wiadomości...
        </div>
      ) : accessDenied ? (
        <div className="rounded-xl border border-white/10 bg-background-4/60 px-4 py-3 text-sm text-foreground-2">
          Brak dostępu do tego kanału.
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-background-4/60 px-4 py-3 text-sm text-foreground-2">
          Brak wpisów w tym kanale. Dodaj pierwszą wiadomość.
        </div>
      ) : (
        messages.map((message) => {
          const avatarSrc = message.author.avatar || fallbackAvatar;
          const isHidden = Boolean(message.hiddenAt);
          const isMenuOpen = openMenuId === message.id;
          const isRevealed = Boolean(revealedMessageIds[message.id]);
          const showHidden = !isHidden || isRevealed;
          const messageTextClass = showHidden
            ? "text-foreground-2"
            : "text-foreground-3 italic blur-[2px] select-none";

          return (
            <article key={message.id} className="flex gap-3">
              <Image
                src={avatarSrc}
                alt="Użytkownik"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border border-white/10 object-cover"
                onError={(event) =>
                  handleUploadImageError(
                    event.currentTarget,
                    "/artwork/404_user.png"
                  )
                }
              />
              <div className="flex-1 space-y-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                      {message.author.name}
                    </span>
                    {message.author.role && (
                      <span className="shrink-0 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
                        {message.author.role}
                      </span>
                    )}
                    {isAdminViewer && isHidden && (
                      <span className="shrink-0 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-200">
                        Ukryta
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-foreground-2">
                      {formatTimestamp(message.createdAt)}
                    </span>
                    {isAdminViewer && (
                      <div className="relative" data-admin-menu>
                      <button
                        type="button"
                        data-admin-menu-button
                        onClick={() =>
                          onToggleMenu(isMenuOpen ? null : message.id)
                        }
                        aria-label="Zarządzaj wiadomością"
                        aria-expanded={isMenuOpen}
                        disabled={adminActionId === message.id}
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-background-4/70 text-foreground-2 transition hover:border-accent/40 hover:text-accent disabled:opacity-60"
                      >
                        <MoreVertical size={12} />
                      </button>
                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-background-3/95 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                          <button
                            type="button"
                            onClick={() => onHideMessage(message, !isHidden)}
                            disabled={adminActionId === message.id}
                            className="w-full px-4 py-2 text-left text-xs text-foreground-2 hover:bg-background-4/80 hover:text-foreground disabled:opacity-60"
                          >
                            {isHidden ? "Pokaż" : "Ukryj"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteMessage(message.id)}
                            disabled={adminActionId === message.id}
                            className="w-full px-4 py-2 text-left text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-60"
                          >
                            Usuń dla wszystkich
                          </button>
                        </div>
                      )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-tight">
                  <span
                    className={`transition duration-200 ${messageTextClass}`}
                  >
                    {renderMessageText(message.text)}
                  </span>
                  {isHidden && (
                    <button
                      type="button"
                      onClick={() => onToggleReveal(message.id)}
                      aria-pressed={isRevealed}
                      aria-label={
                        isRevealed
                          ? "Ukryj podgląd wiadomości"
                          : "Pokaż ukrytą wiadomość"
                      }
                      className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-background-4/70 text-foreground-2 transition hover:border-accent/40 hover:text-accent"
                    >
                      {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </p>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
