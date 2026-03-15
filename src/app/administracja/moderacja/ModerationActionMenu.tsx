"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LucideAlertCircle,
  LucideCheckCircle,
  LucideClock,
  LucideLogOut,
  LucideShield,
  LucideUserCheck,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useAdminViewer } from "@/app/admin/components/AdminContext";
import { Role as Roles } from "@/lib/prismaEnums";
import type { Role } from "@/lib/prismaEnums";
import { cn } from "@/utils";

type AdminUserRow = {
  id: number;
  username: string;
  nick?: string | null;
  email: string;
  role: Role;
  bannedAt?: string | Date | null;
  banReason?: string | null;
  suspensionUntil?: string | Date | null;
  suspensionReason?: string | null;
};

type ModerationAction =
  | "KICK"
  | "BAN"
  | "SUSPEND"
  | "WARN"
  | "UNBAN"
  | "UNSUSPEND";

type ModerationForm = {
  reason: string;
  customReason: string;
  durationMinutes: number;
};

type Tile = {
  title: string;
  description: string;
  action: ModerationAction;
  tone: "danger" | "warning" | "info" | "success" | "neutral";
  icon: LucideIcon;
  needsReason: boolean;
  needsDuration?: boolean;
  requiresConfirm?: boolean;
};

const MODERATION_TILES: Tile[] = [
  {
    title: "Zbanuj",
    description: "Trwale blokuje konto i zapisuje powód.",
    action: "BAN",
    tone: "danger",
    icon: LucideShield,
    needsReason: true,
    requiresConfirm: true,
  },
  {
    title: "Wyślij na przerwę",
    description: "Czasowa blokada dostępu do konta.",
    action: "SUSPEND",
    tone: "warning",
    icon: LucideClock,
    needsReason: true,
    needsDuration: true,
  },
  {
    title: "Wyloguj",
    description: "Natychmiastowe wyrzucenie z sesji.",
    action: "KICK",
    tone: "info",
    icon: LucideLogOut,
    needsReason: true,
  },
  {
    title: "Ostrzeż",
    description: "Ostrzeżenie i wpis do historii konta.",
    action: "WARN",
    tone: "warning",
    icon: LucideAlertCircle,
    needsReason: true,
  },
  {
    title: "Cofnij bana",
    description: "Przywrócenie dostępu po banie.",
    action: "UNBAN",
    tone: "success",
    icon: LucideCheckCircle,
    needsReason: false,
  },
  {
    title: "Zakończ przerwę",
    description: "Natychmiastowe zdjęcie blokady czasowej.",
    action: "UNSUSPEND",
    tone: "success",
    icon: LucideUserCheck,
    needsReason: false,
  },
];

const MODERATION_REASONS: Array<{ value: string; label: string }> = [
  { value: "SPAM", label: "Spam" },
  { value: "ABUSE", label: "Nękanie" },
  { value: "HARASSMENT", label: "Wulgaryzmy" },
  { value: "IMPERSONATION", label: "Podszywanie" },
  { value: "RULES", label: "Naruszenie regulaminu" },
  { value: "ILLEGAL", label: "Treść nielegalna" },
  { value: "OTHER", label: "Inny powód" },
];

const SUSPENSION_DURATIONS: Array<{ value: number; label: string }> = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 godz." },
  { value: 12 * 60, label: "12 godz." },
  { value: 24 * 60, label: "1 dzień" },
  { value: 3 * 24 * 60, label: "3 dni" },
  { value: 7 * 24 * 60, label: "7 dni" },
  { value: 30 * 24 * 60, label: "30 dni" },
];

const DEFAULT_FORM: ModerationForm = {
  reason: MODERATION_REASONS[0].value,
  customReason: "",
  durationMinutes: 24 * 60,
};

const toneStyles: Record<Tile["tone"], string> = {
  danger: "border-red-500/30 bg-red-600/10 text-red-200",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  neutral: "border-white/10 bg-background-3 text-foreground-2",
};

const resolveUserLabel = (user: AdminUserRow) =>
  user.nick || user.username || user.email;

const getReasonLabel = (value: string) =>
  MODERATION_REASONS.find((item) => item.value === value)?.label ?? value;

export default function ModerationActionMenu({
  users,
}: {
  users: AdminUserRow[];
}) {
  const viewer = useAdminViewer();
  const router = useRouter();
  const [rows, setRows] = useState<AdminUserRow[]>(users);
  const [activeAction, setActiveAction] = useState<ModerationAction | null>(
    null
  );
  const [form, setForm] = useState<ModerationForm>(DEFAULT_FORM);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (u) =>
        resolveUserLabel(u).toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [query, rows]);

  const activeTile = useMemo(
    () => MODERATION_TILES.find((tile) => tile.action === activeAction) ?? null,
    [activeAction]
  );

  const selectedUser = useMemo(
    () => rows.find((u) => u.id === selectedUserId) ?? null,
    [rows, selectedUserId]
  );

  useEffect(() => {
    if (!activeAction) return;
    setForm(DEFAULT_FORM);
    setErrorMessage(null);
    const target = document.getElementById("moderacja-menu");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeAction]);

  const toast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2400);
  };

  const canManageUser = (user: AdminUserRow) => {
    if (user.id === viewer.id) return false;
    if (user.role === Roles.OWNER && viewer.role !== Roles.OWNER) return false;
    return true;
  };

  const updateForm = (patch: Partial<ModerationForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const applyModeration = async () => {
    if (!activeAction || !activeTile) return;
    if (!selectedUser) {
      setErrorMessage("Wybierz użytkownika.");
      return;
    }
    if (!canManageUser(selectedUser)) {
      setErrorMessage("Nie możesz moderować tego użytkownika.");
      return;
    }

    const needsReason = activeTile.needsReason;
    const reason =
      form.reason === "OTHER"
        ? form.customReason.trim()
        : getReasonLabel(form.reason).trim();

    if (needsReason && !reason) {
      setErrorMessage("Podaj powód.");
      return;
    }

    if (activeTile.requiresConfirm) {
      const ok = confirm("Na pewno chcesz zbanować to konto?");
      if (!ok) return;
    }

    setBusy(true);
    setErrorMessage(null);
    try {
      const payload: Record<string, any> = { action: activeAction };
      if (needsReason) payload.reason = reason;
      if (activeTile.needsDuration) {
        payload.durationMinutes = form.durationMinutes;
      }

      const res = await fetch(
        `/api/admin/users/${selectedUser.id}/moderation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMessage("Nie udało się zapisać zmian.");
        return;
      }

      if (data?.user) {
        setRows((prev) =>
          prev.map((row) => {
            if (row.id !== selectedUser.id) return row;
            return {
              ...row,
              email: data.user.email ?? row.email,
              username:
                data.user.username ??
                data.user.nick ??
                data.user.email ??
                row.username,
              nick: data.user.nick ?? row.nick ?? null,
              role: data.user.role ?? row.role,
              bannedAt: data.user.bannedAt ?? null,
              banReason: data.user.banReason ?? null,
              suspensionUntil: data.user.suspensionUntil ?? null,
              suspensionReason: data.user.suspensionReason ?? null,
            };
          })
        );
      }

      toast(data?.message || "Zapisano zmiany.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const statusLabel = (() => {
    if (!selectedUser) return null;
    if (selectedUser.bannedAt) return "Zbanowany";
    const until = selectedUser.suspensionUntil
      ? new Date(selectedUser.suspensionUntil)
      : null;
    if (until && !Number.isNaN(until.getTime()) && until.getTime() > Date.now()) {
      return `Przerwa do ${until.toLocaleString("pl-PL")}`;
    }
    return "Aktywny";
  })();

  return (
    <>
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Menu moderacji kont
          </h2>
          <p className="text-sm text-foreground-2">
            Kliknij kafelek, aby otworzyć menu akcji.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODERATION_TILES.map((tile) => {
            const Icon = tile.icon;
            const isActive = tile.action === activeAction;
            return (
              <button
                key={tile.title}
                type="button"
                onClick={() => setActiveAction(tile.action)}
                className={cn(
                  "interactive-card group flex flex-col justify-between rounded-2xl border border-white/10 bg-background-2 p-4 text-left transition hover:border-accent/40",
                  isActive && "border-accent/40 bg-background-3"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl border p-2 ${toneStyles[tile.tone]}`}>
                    <Icon size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{tile.title}</p>
                    <p className="text-sm text-foreground-2">
                      {tile.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-foreground-2">
                  <span className="rounded-full border border-white/10 bg-background-3 px-2 py-1 text-[11px] uppercase tracking-[0.12em]">
                    {tile.action}
                  </span>
                  <span className="group-hover:text-foreground">
                    Otwórz menu
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section
        id="moderacja-menu"
        className="rounded-2xl border border-white/10 bg-background-2 p-4"
      >
        <div className="mb-4 space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            {activeTile ? `Menu: ${activeTile.title}` : "Menu akcji"}
          </h2>
          <p className="text-sm text-foreground-2">
            {activeTile
              ? activeTile.description
              : "Wybierz akcje z kafelków powyżej."}
          </p>
        </div>

        {activeTile ? (
          <div className="space-y-4">
            {errorMessage && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-foreground-2">
                Użytkownik
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Szukaj po nicku, nazwie lub e-mailu..."
                  className="w-full rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-[13px] text-foreground outline-none"
                />
                <select
                  value={selectedUserId ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (!raw) {
                      setSelectedUserId(null);
                      return;
                    }
                    const nextId = Number(raw);
                    setSelectedUserId(Number.isFinite(nextId) ? nextId : null);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-[13px] text-foreground outline-none"
                >
                  <option value="">Wybierz użytkownika</option>
                  {filteredUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {resolveUserLabel(user)} | {user.email}
                    </option>
                  ))}
                </select>
                {selectedUser && (
                  <div className="text-xs text-foreground-2">
                    Status: {statusLabel}
                  </div>
                )}
              </label>

              {activeTile.needsReason && (
                <label className="flex flex-col gap-2 text-sm text-foreground-2">
                  Powód
                  <select
                    value={form.reason}
                    onChange={(event) =>
                      updateForm({ reason: event.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-[13px] text-foreground outline-none"
                  >
                    {MODERATION_REASONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {form.reason === "OTHER" && (
                    <input
                      value={form.customReason}
                      onChange={(event) =>
                        updateForm({ customReason: event.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-[13px] text-foreground outline-none"
                      placeholder="Wpisz powód..."
                    />
                  )}
                </label>
              )}

              {activeTile.needsDuration && (
                <label className="flex flex-col gap-2 text-sm text-foreground-2">
                  Czas przerwy
                  <select
                    value={form.durationMinutes}
                    onChange={(event) =>
                      updateForm({
                        durationMinutes: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-[13px] text-foreground outline-none"
                  >
                    {SUSPENSION_DURATIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveAction(null)}
                className="rounded-full border border-white/10 bg-background-3 px-4 py-2 text-sm text-foreground-2 hover:text-foreground"
              >
                Zamknij
              </button>
              <button
                type="button"
                onClick={applyModeration}
                disabled={!selectedUser || busy}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black hover:shadow-[0_0_18px_rgba(0,206,0,0.35)] transition-shadow disabled:opacity-60"
              >
                {busy ? "Zapisywanie..." : "Zastosuj"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-background-3 px-3 py-3 text-sm text-foreground-2">
            Kliknij jedno z okienek, aby otworzyć menu akcji.
          </div>
        )}
      </section>

      {toastMessage && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 rounded-xl border border-white/10 bg-background-4/90 px-4 py-2 text-sm text-foreground shadow-2xl animate-toast">
          {toastMessage}
        </div>
      )}
    </>
  );
}
