"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Users, Clock, UserCheck, UserX, MessageSquare, UserMinus, Search } from "lucide-react";
import Page from "@/components/Page";
import UploadImage from "@/components/UploadImage";

type UserSnippet = {
  id: number;
  username: string | null;
  nick: string | null;
  name: string;
  avatarUrl: string | null;
};

type Friend = {
  friendshipId: string;
  friend: UserSnippet;
  since: string;
};

type FriendRequest = {
  id: string;
  sender?: UserSnippet;
  receiver?: UserSnippet;
  createdAt: string;
};

function displayName(u: UserSnippet) {
  return u.username || u.nick || u.name || "Użytkownik";
}

function Avatar({ user }: { user: UserSnippet }) {
  return (
    <div className="h-11 w-11 rounded-full overflow-hidden bg-background-2 shrink-0 border border-white/10">
      <UploadImage
        src={user.avatarUrl ?? "/artwork/404_user.png"}
        alt={displayName(user)}
        className="h-full w-full object-cover"
        fallbackSrc="/artwork/404_user.png"
      />
    </div>
  );
}

export default function ZnajomiPage() {
  const [tab, setTab] = useState<"friends" | "pending">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function load() {
    const [fr, req] = await Promise.all([
      fetch("/api/znajomi").then((r) => r.json()),
      fetch("/api/znajomi/zaproszenia").then((r) => r.json()),
    ]);
    if (!mounted.current) return;
    setFriends(fr.friends ?? []);
    setIncoming(req.incoming ?? []);
    setOutgoing(req.outgoing ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(friendshipId: string) {
    await fetch(`/api/znajomi/${friendshipId}`, { method: "DELETE" });
    setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
  }

  async function handleAccept(requestId: string) {
    await fetch(`/api/znajomi/zaproszenia/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    await load();
  }

  async function handleReject(requestId: string) {
    await fetch(`/api/znajomi/zaproszenia/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    setIncoming((prev) => prev.filter((r) => r.id !== requestId));
  }

  async function handleCancel(requestId: string) {
    await fetch(`/api/znajomi/zaproszenia/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    setOutgoing((prev) => prev.filter((r) => r.id !== requestId));
  }

  const pendingCount = incoming.length;

  return (
    <Page>
      <div className="w-full flex flex-col items-center pt-[170px] pb-20 px-4">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Znajomi</h1>
            <Link
              href="/szukaj?type=users"
              className="flex items-center gap-2 text-sm text-foreground-2 hover:text-accent transition-colors"
            >
              <Search size={16} />
              Szukaj ludzi
            </Link>
          </div>

          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setTab("friends")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "friends" ? "border-accent text-accent" : "border-transparent text-foreground-2 hover:text-foreground"}`}
            >
              <UserCheck size={16} />
              Znajomi ({friends.length})
            </button>
            <button
              onClick={() => setTab("pending")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "pending" ? "border-accent text-accent" : "border-transparent text-foreground-2 hover:text-foreground"}`}
            >
              <Clock size={16} />
              Oczekujące
              {pendingCount > 0 && (
                <span className="ml-1 bg-accent text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-foreground-2">Ładowanie...</div>
          ) : tab === "friends" ? (
            friends.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-3 text-foreground-2">
                <Users size={48} className="opacity-30" />
                <p className="text-base">Nie masz jeszcze żadnych znajomych.</p>
                <Link href="/szukaj?type=users" className="text-accent hover:underline text-sm">
                  Znajdź kogoś do dodania
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {friends.map(({ friendshipId, friend }) => (
                  <div
                    key={friendshipId}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-background-3/60 hover:bg-background-3/80 transition-colors"
                  >
                    <Link href={`/profil/${friend.username ?? friend.id}`}>
                      <Avatar user={friend} />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profil/${friend.username ?? friend.id}`}
                        className="font-medium text-foreground hover:text-accent transition-colors truncate block"
                      >
                        @{displayName(friend)}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/wiadomosci/${friend.id}`}
                        className="flex items-center justify-center h-9 w-9 rounded-full border border-white/10 text-foreground-2 hover:text-accent hover:border-accent/40 transition-colors"
                        title="Wyślij wiadomość"
                      >
                        <MessageSquare size={16} />
                      </Link>
                      <button
                        onClick={() => handleRemove(friendshipId)}
                        className="flex items-center justify-center h-9 w-9 rounded-full border border-white/10 text-foreground-2 hover:text-red-400 hover:border-red-500/40 transition-colors"
                        title="Usuń ze znajomych"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-6">
              {incoming.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-foreground-2 mb-3">Otrzymane zaproszenia</h2>
                  <div className="flex flex-col gap-3">
                    {incoming.map((req) => {
                      const user = req.sender!;
                      return (
                        <div key={req.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-background-3/60">
                          <Link href={`/profil/${user.username ?? user.id}`}>
                            <Avatar user={user} />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/profil/${user.username ?? user.id}`} className="font-medium text-foreground hover:text-accent transition-colors truncate block">
                              @{displayName(user)}
                            </Link>
                            <p className="text-xs text-foreground-2">chce być Twoim znajomym</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleAccept(req.id)}
                              className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-accent text-black text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                              <UserCheck size={15} />
                              Przyjmij
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="flex items-center justify-center h-9 w-9 rounded-full border border-white/10 text-foreground-2 hover:text-red-400 hover:border-red-500/40 transition-colors"
                              title="Odrzuć"
                            >
                              <UserX size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {outgoing.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-foreground-2 mb-3">Wysłane zaproszenia</h2>
                  <div className="flex flex-col gap-3">
                    {outgoing.map((req) => {
                      const user = req.receiver!;
                      return (
                        <div key={req.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-background-3/60">
                          <Link href={`/profil/${user.username ?? user.id}`}>
                            <Avatar user={user} />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/profil/${user.username ?? user.id}`} className="font-medium text-foreground hover:text-accent transition-colors truncate block">
                              @{displayName(user)}
                            </Link>
                            <p className="text-xs text-foreground-2">oczekuje na akceptację</p>
                          </div>
                          <button
                            onClick={() => handleCancel(req.id)}
                            className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-white/10 text-foreground-2 hover:text-red-400 hover:border-red-500/40 text-sm transition-colors shrink-0"
                          >
                            Anuluj
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {incoming.length === 0 && outgoing.length === 0 && (
                <div className="flex flex-col items-center py-16 gap-3 text-foreground-2">
                  <Clock size={48} className="opacity-30" />
                  <p className="text-base">Brak oczekujących zaproszeń.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
