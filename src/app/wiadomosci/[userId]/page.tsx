"use client";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Send, ChevronUp } from "lucide-react";
import Page from "@/components/Page";
import UploadImage from "@/components/UploadImage";

type UserSnippet = {
  id: number;
  username: string | null;
  nick: string | null;
  name: string;
  avatarUrl: string | null;
};

type DmMessage = {
  id: string;
  text: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
  sender: UserSnippet;
};

function displayName(u: UserSnippet) {
  return u.username || u.nick || u.name || "Użytkownik";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  return isToday
    ? d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pl-PL", { day: "2-digit", month: "short" }) +
        " " +
        d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export default function DmPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: userIdStr } = use(params);
  const userId = Number(userIdStr);

  const [other, setOther] = useState<UserSnippet | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(true);
  const oldestRef = useRef<string | null>(null);
  const justSentRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, []);

  const fetchMessages = useCallback(async (before?: string) => {
    const url = `/api/wiadomosci/${userId}${before ? `?before=${encodeURIComponent(before)}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json() as Promise<{ other: UserSnippet; messages: DmMessage[]; hasMore: boolean }>;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchMessages().then((data) => {
      if (!data || !mounted.current) return;
      setOther(data.other);
      setMessages(data.messages);
      setHasMore(data.hasMore);
      oldestRef.current = data.messages[0]?.createdAt ?? null;
      setLoading(false);
      scrollToBottom();
    });
  }, [userId, fetchMessages, scrollToBottom]);

  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(async () => {
      const data = await fetchMessages();
      if (!data || !mounted.current) return;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = data.messages.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length === 0) return prev;
        const merged = [...prev, ...newMsgs].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        if (!justSentRef.current) scrollToBottom();
        return merged;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [userId, fetchMessages, scrollToBottom]);

  useEffect(() => {
    if (justSentRef.current) {
      justSentRef.current = false;
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  async function loadOlder() {
    const cursor = oldestRef.current;
    if (!cursor || loadingOlder) return;
    setLoadingOlder(true);
    const el = listRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const data = await fetchMessages(cursor);
    if (!data || !mounted.current) { setLoadingOlder(false); return; }
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const older = data.messages.filter((m) => !existingIds.has(m.id));
      if (older.length > 0) oldestRef.current = older[0].createdAt;
      return [...older, ...prev];
    });
    setHasMore(data.hasMore);
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
    });
    setLoadingOlder(false);
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      const res = await fetch(`/api/wiadomosci/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok || !mounted.current) return;
      const msg: DmMessage = await res.json();
      justSentRef.current = true;
      setMessages((prev) => [...prev, msg]);
    } finally {
      if (mounted.current) setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleTextChange(val: string) {
    setText(val);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }

  return (
    <Page>
      <div className="w-full flex flex-col items-center pt-[140px] pb-0 px-4 h-screen">
        <div className="w-full max-w-2xl flex flex-col" style={{ height: "calc(100vh - 140px - 2rem)" }}>

          {/* Header */}
          <div className="flex items-center gap-3 py-3 mb-2 border-b border-white/10 shrink-0">
            <Link
              href="/wiadomosci"
              className="flex items-center justify-center h-9 w-9 rounded-full border border-white/10 text-foreground-2 hover:text-foreground hover:border-white/20 transition-colors shrink-0"
            >
              <ArrowLeft size={16} />
            </Link>
            {other ? (
              <Link href={`/profil/${other.username ?? other.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="h-9 w-9 rounded-full overflow-hidden bg-background-2 shrink-0 border border-white/10">
                  <UploadImage
                    src={other.avatarUrl ?? "/artwork/avatar_default.svg"}
                    alt={displayName(other)}
                    className="h-full w-full object-cover"
                    fallbackSrc="/artwork/avatar_default.svg"
                  />
                </div>
                <span className="font-medium text-foreground">@{displayName(other)}</span>
              </Link>
            ) : (
              <div className="h-5 w-32 rounded bg-background-3 animate-pulse" />
            )}
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto py-2 flex flex-col gap-1 min-h-0">
            {loading ? (
              <div className="text-center py-12 text-foreground-2 text-sm">Ładowanie...</div>
            ) : (
              <>
                {hasMore && (
                  <button
                    onClick={loadOlder}
                    disabled={loadingOlder}
                    className="mx-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground-2 hover:text-foreground border border-white/10 rounded-full transition-colors mb-2"
                  >
                    <ChevronUp size={12} />
                    {loadingOlder ? "Ładowanie..." : "Załaduj starsze"}
                  </button>
                )}

                {messages.length === 0 && (
                  <div className="flex flex-col items-center py-12 gap-2 text-foreground-2 text-sm">
                    <p>Brak wiadomości. Napisz coś!</p>
                  </div>
                )}

                {messages.map((msg, i) => {
                  const prev = messages[i - 1];
                  const isSameAuthor = prev && prev.isMine === msg.isMine &&
                    new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;

                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.isMine ? "flex-row-reverse" : "flex-row"} ${isSameAuthor ? "mt-0.5" : "mt-3"}`}>
                      {!msg.isMine && !isSameAuthor && (
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-background-2 shrink-0 border border-white/10">
                          <UploadImage
                            src={msg.sender.avatarUrl ?? "/artwork/avatar_default.svg"}
                            alt={displayName(msg.sender)}
                            className="h-full w-full object-cover"
                            fallbackSrc="/artwork/avatar_default.svg"
                          />
                        </div>
                      )}
                      {!msg.isMine && isSameAuthor && <div className="w-7 shrink-0" />}

                      <div className={`max-w-[72%] sm:max-w-[65%] ${msg.isMine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                        {!isSameAuthor && !msg.isMine && (
                          <span className="text-xs text-foreground-2 ml-1">@{displayName(msg.sender)}</span>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap ${
                          msg.isMine
                            ? "bg-accent text-black rounded-br-sm"
                            : "bg-background-3 text-foreground border border-white/10 rounded-bl-sm"
                        }`}>
                          {msg.text}
                        </div>
                        {!isSameAuthor && (
                          <span className="text-[10px] text-foreground-2 mx-1">{formatTime(msg.createdAt)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Composer */}
          <div className="shrink-0 pt-3 pb-4 border-t border-white/10">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={other ? `Napisz do @${displayName(other)}...` : "Napisz wiadomość..."}
                rows={1}
                className="flex-1 resize-none rounded-2xl bg-background-3/80 border border-white/10 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/40 transition-colors leading-relaxed"
                style={{ minHeight: "42px", maxHeight: "120px" }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-accent text-black disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-foreground-2 mt-1.5 ml-1">Enter — wyślij · Shift+Enter — nowy wiersz</p>
          </div>
        </div>
      </div>
    </Page>
  );
}
