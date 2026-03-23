"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  MessageSquare,
  AtSign,
  Mail,
  Images,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils";

type NotificationItem = {
  id: string;
  type: string;
  payload: string | null;
  createdAt: string;
  readAt: string | null;
};

type ParsedPayload = {
  by?: string;
  text?: string;
  threadId?: number;
  galleryId?: string;
  conversationId?: number;
};

function parsePayload(raw: string | null): ParsedPayload {
  if (!raw) return {};
  try {
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
}

function formatTimeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "przed chwilą";
  if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} godz. temu`;
  return `${Math.floor(diff / 86400)} dni temu`;
}

type NotifMeta = {
  icon: React.ReactNode;
  label: string;
  href: string;
  preview: string;
};

function resolveNotifMeta(item: NotificationItem): NotifMeta {
  const p = parsePayload(item.payload);
  const by = p.by ? `@${p.by}` : "Ktoś";
  const text = p.text ? `„${p.text.slice(0, 60)}${p.text.length > 60 ? "…" : ""}"` : "";

  switch (item.type) {
    case "COMMENT_REPLY":
      return {
        icon: <MessageSquare size={15} className="text-blue-400" />,
        label: "Odpowiedź na komentarz",
        preview: `${by} odpowiedział na Twój komentarz${text ? ": " + text : ""}`,
        href: p.threadId ? `/forum?thread=${p.threadId}` : "/forum",
      };
    case "COMMENT_MENTION":
      return {
        icon: <AtSign size={15} className="text-accent" />,
        label: "Oznaczenie w komentarzu",
        preview: `${by} oznaczył Cię w komentarzu${text ? ": " + text : ""}`,
        href: p.threadId ? `/forum?thread=${p.threadId}` : "/forum",
      };
    case "THREAD_MENTION":
      return {
        icon: <AtSign size={15} className="text-accent" />,
        label: "Oznaczenie w wątku",
        preview: `${by} oznaczył Cię w wątku${text ? ": " + text : ""}`,
        href: p.threadId ? `/forum?thread=${p.threadId}` : "/forum",
      };
    case "GALLERY_MENTION":
      return {
        icon: <Images size={15} className="text-purple-400" />,
        label: "Oznaczenie w galerii",
        preview: `${by} oznaczył Cię w galerii`,
        href: p.galleryId ? `/galeria?zdjecie=${p.galleryId}` : "/galeria",
      };
    case "NEW_MESSAGE":
      return {
        icon: <Mail size={15} className="text-green-400" />,
        label: "Nowa wiadomość",
        preview: `${by} wysłał Ci wiadomość${text ? ": " + text : ""}`,
        href: "/wiadomosci",
      };
    default:
      return {
        icon: <Bell size={15} className="text-foreground-2" />,
        label: "Powiadomienie",
        preview: "Masz nowe powiadomienie",
        href: "/",
      };
  }
}

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setCount(Number(data?.count ?? 0));
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 30_000);
    return () => window.clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const markAllRead = useCallback(async () => {
    if (count === 0 || marking) return;
    setMarking(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
      });
      setCount(0);
      setItems((prev) =>
        prev.map((item) => ({ ...item, readAt: new Date().toISOString() }))
      );
    } catch {
      // ignore
    } finally {
      setMarking(false);
    }
  }, [count, marking]);

  const handleOpen = useCallback(() => {
    setOpen((v) => {
      if (!v) {
        setLoading(true);
        fetch("/api/notifications", {
          credentials: "include",
          cache: "no-store",
        })
          .then((r) => r.json())
          .then((data) => {
            setCount(Number(data?.count ?? 0));
            setItems(Array.isArray(data?.items) ? data.items : []);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
      return !v;
    });
  }, []);

  const unread = count;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleOpen}
        aria-label="Powiadomienia"
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
          open
            ? "bg-accent/20 text-accent"
            : "text-foreground-2 hover:bg-white/8 hover:text-foreground"
        )}
      >
        <Bell size={18} className={cn(open && "animate-[ring_0.4s_ease]")} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[10px] font-bold text-white leading-none shadow-[0_0_0_2px_var(--color-background)]">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl border border-white/10 bg-background-2 shadow-[0_16px_60px_rgba(0,0,0,0.6)] overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="text-sm font-semibold text-foreground">
              Powiadomienia
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={marking}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-foreground-2 hover:bg-white/8 hover:text-foreground transition-colors disabled:opacity-50"
              >
                {marking ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CheckCheck size={12} />
                )}
                Oznacz jako przeczytane
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-foreground-2">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-foreground-2">
                <Bell size={32} className="opacity-30" />
                <p className="text-sm">Brak powiadomień</p>
              </div>
            ) : (
              <div>
                {items.map((item) => {
                  const meta = resolveNotifMeta(item);
                  const isUnread = !item.readAt;
                  return (
                    <Link
                      key={item.id}
                      href={meta.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 border-b border-white/5 last:border-b-0",
                        isUnread && "bg-accent/5"
                      )}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background-3">
                        {meta.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isUnread ? "text-foreground" : "text-foreground-2"
                            )}
                          >
                            {meta.label}
                          </span>
                          {isUnread && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-foreground-2 line-clamp-2 leading-relaxed">
                          {meta.preview}
                        </p>
                        <p className="mt-1 text-[10px] text-foreground-2/60">
                          {formatTimeAgo(item.createdAt)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-white/8 px-4 py-2">
            <Link
              href="/profil/ustawienia#powiadomienia"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs text-foreground-2 hover:text-foreground transition-colors"
            >
              Ustawienia powiadomień
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
