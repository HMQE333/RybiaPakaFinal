"use client";

import type { KeyboardEvent, RefObject } from "react";
import Link from "next/link";
import { MessageCircle, Smile } from "lucide-react";

import type { CustomEmoji } from "../types";

type ChatComposerProps = {
  emojiOpen: boolean;
  onToggleEmoji: () => void;
  emojiButtonRef: RefObject<HTMLButtonElement | null>;
  emojiMenuRef: RefObject<HTMLDivElement | null>;
  composerRef: RefObject<HTMLDivElement | null>;
  customEmojis: CustomEmoji[];
  insertEmoji: (emoji: CustomEmoji) => void;
  isAuthenticated: boolean;
  accessDenied: boolean;
  messageInput: string;
  placeholderText: string;
  onComposerInput: () => void;
  onComposerKey: (event: KeyboardEvent<HTMLDivElement>) => void;
  onSend: () => void;
  sending: boolean;
  authReady: boolean;
  error: string | null;
};

export default function ChatComposer({
  emojiOpen,
  onToggleEmoji,
  emojiButtonRef,
  emojiMenuRef,
  composerRef,
  customEmojis,
  insertEmoji,
  isAuthenticated,
  accessDenied,
  messageInput,
  placeholderText,
  onComposerInput,
  onComposerKey,
  onSend,
  sending,
  authReady,
  error,
}: ChatComposerProps) {
  return (
    <div className="border-t border-white/10 bg-background-3/90 px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-3 sm:flex-1">
          <div className="relative">
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={() => {
                if (!isAuthenticated || accessDenied) return;
                onToggleEmoji();
              }}
              aria-haspopup="dialog"
              aria-expanded={emojiOpen}
              aria-label="Otwórz menu emotek"
              disabled={!isAuthenticated || accessDenied}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent/40 bg-accent/10 text-accent shadow-[0_10px_30px_rgba(0,206,0,0.18)] transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Smile size={18} />
            </button>

            {emojiOpen && (
              <div
                ref={emojiMenuRef}
                className="absolute left-0 bottom-full mb-3 w-[420px] max-w-[92vw] rounded-2xl border border-white/10 bg-background-3/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur"
              >
                <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-foreground-2">
                  Emotki RybiaPaka
                </div>
                <div className="custom-scrollbar -mx-1 grid max-h-72 grid-cols-4 gap-3 overflow-y-auto px-1 pb-1">
                  {customEmojis.map((emoji) => (
                    <button
                      key={emoji.id}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="group flex w-full min-h-[96px] flex-col items-center gap-2 rounded-xl border border-white/10 bg-background-4/70 px-2 py-3 text-foreground transition hover:border-accent/40 hover:bg-background-4"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={emoji.src}
                        alt={emoji.label}
                        width={32}
                        height={32}
                        className="h-8 w-8"
                      />
                      <span className="min-h-[28px] text-center text-[11px] leading-tight text-foreground-2 group-hover:text-foreground">
                        {emoji.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex h-12 flex-1 items-center rounded-2xl border border-white/10 bg-background-4/80 px-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="relative w-full">
              {!messageInput.trim() && (
                <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-sm text-foreground-2">
                  {placeholderText}
                </span>
              )}
              <div
                ref={composerRef}
                contentEditable={isAuthenticated && !accessDenied}
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="false"
                aria-disabled={!isAuthenticated || accessDenied}
                onInput={onComposerInput}
                onKeyDown={onComposerKey}
                onBlur={onComposerInput}
                className={`relative z-10 w-full whitespace-pre-wrap text-sm leading-snug text-foreground outline-none ${
                  !isAuthenticated || accessDenied ? "opacity-60" : ""
                }`}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={sending || !messageInput.trim() || !isAuthenticated || accessDenied}
          className="inline-flex h-12 items-center justify-center gap-2 self-end rounded-xl border border-accent/40 bg-accent/10 px-4 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MessageCircle size={16} />
          <span>{sending ? "Wysyłanie..." : "Wyślij"}</span>
        </button>
      </div>
      {authReady && !isAuthenticated && (
        <Link
          href="/logowanie"
          className="mt-3 inline-flex text-sm text-foreground-2 underline decoration-white/20 underline-offset-4 transition hover:text-accent hover:decoration-accent/60"
        >
          Zaloguj się, aby napisać wiadomość.
        </Link>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
