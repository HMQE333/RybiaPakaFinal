"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquare, Search, Users } from "lucide-react";
import Page from "@/components/Page";
import UploadImage from "@/components/UploadImage";

type UserSnippet = {
  id: number;
  username: string | null;
  nick: string | null;
  name: string;
  avatarUrl: string | null;
};

type Conversation = {
  otherId: number;
  other: UserSnippet;
  lastMessage: { text: string; createdAt: string; isMine: boolean };
  unreadCount: number;
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
  if (isToday) {
    return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "short" });
}

export default function WiadomosciPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetch("/api/wiadomosci")
      .then((r) => r.json())
      .then((data) => {
        if (mounted.current) {
          setConversations(data.conversations ?? []);
          setLoading(false);
        }
      })
      .catch(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, []);

  return (
    <Page>
      <div className="w-full flex flex-col items-center pt-[170px] pb-20 px-4">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Wiadomości</h1>
            <Link
              href="/znajomi"
              className="flex items-center gap-2 text-sm text-foreground-2 hover:text-accent transition-colors"
            >
              <Users size={16} />
              Znajomi
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-16 text-foreground-2">Ładowanie...</div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-3 text-foreground-2">
              <MessageSquare size={48} className="opacity-30" />
              <p className="text-base">Brak wiadomości.</p>
              <Link href="/znajomi" className="text-accent hover:underline text-sm">
                Znajdź kogoś i napisz do niego
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {conversations.map((conv) => (
                <Link
                  key={conv.otherId}
                  href={`/wiadomosci/${conv.otherId}`}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-background-3/60 hover:bg-background-3/90 transition-colors"
                >
                  <div className="relative h-12 w-12 rounded-full overflow-hidden bg-background-2 shrink-0 border border-white/10">
                    <UploadImage
                      src={conv.other.avatarUrl ?? "/artwork/avatar_default.svg"}
                      alt={displayName(conv.other)}
                      className="h-full w-full object-cover"
                      fallbackSrc="/artwork/avatar_default.svg"
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-accent text-black text-[10px] font-bold rounded-full h-4.5 min-w-[18px] flex items-center justify-center px-1 leading-none">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`font-medium truncate ${conv.unreadCount > 0 ? "text-foreground" : "text-foreground"}`}>
                        @{displayName(conv.other)}
                      </span>
                      <span className="text-xs text-foreground-2 shrink-0">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-foreground-2"}`}>
                      {conv.lastMessage.isMine && <span className="text-foreground-2">Ty: </span>}
                      {conv.lastMessage.text}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
