"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Users, Clock, UserCheck, UserX, MessageSquare, UserMinus, UserPlus, X, Send } from "lucide-react";
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

function AddFriendDialog({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/znajomi/zaproszenia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setInput("");
        setTimeout(() => onSent(), 1200);
      } else {
        const code = data?.error ?? "";
        setErrorMsg(
          code === "Użytkownik nie istnieje"
            ? "Hej! Nasz statek nie dotarł do portu. Sprawdź, czy nick się zgadza — wielkość liter ma znaczenie!"
            : code === "Zaproszenie już istnieje"
              ? "Zaproszenie do tej osoby już zostało wysłane."
              : code === "Jesteście już znajomymi"
                ? "Ta osoba jest już Twoim znajomym!"
                : code === "Nie możesz zaprosić siebie"
                  ? "Nie możesz dodać samego siebie."
                  : "Nie udało się wysłać zaproszenia. Spróbuj ponownie."
        );
        setStatus("error");
      }
    } catch {
      setErrorMsg("Błąd połączenia. Sprawdź internet i spróbuj ponownie.");
      setStatus("error");
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  const trimmed = input.trim();
  const isValid = trimmed.length >= 2;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-background-2 shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_10%_0%,rgba(0,206,0,0.15),transparent_50%)]" />

        <div className="relative px-6 pt-6 pb-2">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-foreground-2 hover:text-foreground hover:bg-white/10 transition-colors"
            aria-label="Zamknij"
          >
            <X size={18} />
          </button>
          <h2 className="text-xl font-bold text-foreground">Dodaj znajomego</h2>
          <p className="mt-1 text-sm text-foreground-2 leading-relaxed">
            Możesz dodać znajomego, wpisując jego nazwę użytkownika. Pamiętaj, że wielkość liter ma znaczenie!
          </p>
        </div>

        <div className="relative px-6 pt-4 pb-6 space-y-4">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-1 transition-colors ${
              status === "error"
                ? "border-red-500/60 bg-red-500/5"
                : "border-white/15 bg-background-3/80 focus-within:border-accent/60"
            }`}
          >
            <span className="shrink-0 text-foreground-2 text-sm select-none">@</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (status !== "idle") { setStatus("idle"); setErrorMsg(""); }
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && isValid) handleSend(); }}
              placeholder="Wpisz nazwę użytkownika"
              className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-foreground-2/50 outline-none"
              disabled={status === "loading" || status === "success"}
              autoComplete="off"
              spellCheck={false}
            />
            {input && status === "idle" && (
              <button
                onClick={() => setInput("")}
                className="shrink-0 p-0.5 rounded-full text-foreground-2 hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {status === "error" && errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm text-accent">
              <UserCheck size={16} className="shrink-0" />
              <span>Zaproszenie zostało wysłane!</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSend}
              disabled={!isValid || status === "loading" || status === "success"}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isValid && status !== "loading" && status !== "success"
                  ? "bg-accent text-black hover:opacity-90 shadow-[0_0_20px_rgba(0,206,0,0.25)]"
                  : "bg-white/10 text-foreground-2/50 cursor-not-allowed"
              }`}
            >
              {status === "loading" ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  Wyślij zaproszenie
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Tab = "friends" | "incoming" | "outgoing";

export default function ZnajomiPage() {
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
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

  function handleDialogSent() {
    setShowAddDialog(false);
    load();
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: "friends",
      label: `Znajomi`,
      icon: <UserCheck size={15} />,
    },
    {
      id: "incoming",
      label: "Otrzymane",
      icon: <UserPlus size={15} />,
      badge: incoming.length || undefined,
    },
    {
      id: "outgoing",
      label: "Wysłane",
      icon: <Send size={15} />,
      badge: outgoing.length || undefined,
    },
  ];

  return (
    <Page>
      {showAddDialog && (
        <AddFriendDialog
          onClose={() => setShowAddDialog(false)}
          onSent={handleDialogSent}
        />
      )}

      <div className="w-full flex flex-col items-center pt-[170px] pb-20 px-4">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Znajomi</h1>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/25 hover:border-accent/50 transition-all"
            >
              <UserPlus size={16} />
              Dodaj znajomego
            </button>
          </div>

          <div className="flex border-b border-white/10 mb-6 gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.id
                    ? "border-accent text-accent"
                    : "border-transparent text-foreground-2 hover:text-foreground"
                }`}
              >
                {t.icon}
                {t.label}
                {t.id === "friends" && (
                  <span className="text-foreground-2 font-normal">({friends.length})</span>
                )}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="bg-accent text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 text-foreground-2">Ładowanie...</div>
          ) : tab === "friends" ? (
            friends.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-4 text-foreground-2">
                <Users size={48} className="opacity-30" />
                <p className="text-base">Nie masz jeszcze żadnych znajomych.</p>
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/25 transition-all"
                >
                  <UserPlus size={15} />
                  Dodaj pierwszego znajomego
                </button>
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
          ) : tab === "incoming" ? (
            incoming.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-foreground-2">
                <UserPlus size={48} className="opacity-30" />
                <p className="text-base">Brak oczekujących zaproszeń.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-foreground-2 uppercase tracking-widest mb-1">
                  Oczekuje na akceptację — {incoming.length}
                </p>
                {incoming.map((req) => {
                  const user = req.sender!;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-background-3/60"
                    >
                      <Link href={`/profil/${user.username ?? user.id}`}>
                        <Avatar user={user} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/profil/${user.username ?? user.id}`}
                          className="font-medium text-foreground hover:text-accent transition-colors truncate block"
                        >
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
            )
          ) : (
            outgoing.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-foreground-2">
                <Clock size={48} className="opacity-30" />
                <p className="text-base">Nie wysłałeś żadnych zaproszeń.</p>
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/25 transition-all"
                >
                  <UserPlus size={15} />
                  Dodaj znajomego
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-foreground-2 uppercase tracking-widest mb-1">
                  Wysłane i oczekujące — {outgoing.length}
                </p>
                {outgoing.map((req) => {
                  const user = req.receiver!;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-background-3/60"
                    >
                      <Link href={`/profil/${user.username ?? user.id}`}>
                        <Avatar user={user} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/profil/${user.username ?? user.id}`}
                          className="font-medium text-foreground hover:text-accent transition-colors truncate block"
                        >
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
            )
          )}
        </div>
      </div>
    </Page>
  );
}
