"use client";

import { useMemo, useState } from "react";
import type { Role } from "@/lib/prismaEnums";
import { LucideSearch, LucideUser } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAdminViewer } from "@/app/admin/components/AdminContext";
import { Role as Roles } from "@/lib/prismaEnums";

type AdminUserRow = {
  id: number;
  username: string;
  nick?: string | null;
  email: string;
  role: Role;
};

export default function UsersTable({ users }: { users: AdminUserRow[] }) {
  const viewer = useAdminViewer();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminUserRow[]>(users);
  const [busyIds, setBusyIds] = useState<Record<number, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.nick ?? "").toLowerCase().includes(q)
    );
  }, [query, rows]);

  const setBusy = (id: number, value: boolean) =>
    setBusyIds((prev) => ({ ...prev, [id]: value }));

  const toast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2400);
  };

  const canManageUser = (user: AdminUserRow) => {
    if (user.id === viewer.id) return false;
    if (user.role === Roles.OWNER && viewer.role !== Roles.OWNER) return false;
    return true;
  };

  const updateRole = async (userId: number, role: Role) => {
    setBusy(userId, true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.user) {
        toast("Nie udało się zmienić roli.");
        return;
      }

      setRows((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const username =
            data.user?.username ?? data.user?.nick ?? data.user?.email ?? u.username;
          return {
            ...u,
            email: data.user?.email ?? u.email,
            username,
            nick: data.user?.nick ?? u.nick ?? null,
            role: data.user?.role ?? u.role,
          };
        })
      );
      toast("Zapisano zmiany.");
      router.refresh();
    } finally {
      setBusy(userId, false);
    }
  };


  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-background-3 rounded-xl border border-white/10 w-full">
          <LucideSearch size={16} className="text-foreground-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj użytkownika..."
            className="w-full bg-transparent outline-none text-[13px] text-foreground placeholder:text-foreground-2"
          />
        </div>
        <div className="hidden md:flex items-center gap-2 text-foreground-2 text-sm">
          <LucideUser size={16} />
          <span>{filtered.length} wyników</span>
        </div>
      </div>

      <div className="space-y-3 sm:hidden">
        {filtered.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-white/10 bg-background-3/70 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  {u.username}
                </div>
                {u.nick && u.nick !== u.username && (
                  <div className="text-xs text-foreground-2">@{u.nick}</div>
                )}
              </div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-foreground-2">
                {u.role}
              </div>
            </div>
            <div className="mt-2 text-xs text-foreground-2 break-all">
              {u.email}
            </div>
            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-foreground-2">
                Rola
              </div>
              <select
                value={u.role}
                disabled={!canManageUser(u) || busyIds[u.id]}
                onChange={(e) => updateRole(u.id, e.target.value as Role)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-[13px] text-foreground outline-none disabled:opacity-60"
              >
                <option value={Roles.NORMAL}>NORMAL</option>
                <option value={Roles.ADMIN}>ADMIN</option>
                {viewer.role === Roles.OWNER && (
                  <option value={Roles.OWNER}>OWNER</option>
                )}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden w-full overflow-x-auto sm:block">
        <table className="w-full text-left">
          <thead>
            <tr className="text-foreground-2 text-[12px]">
              <th className="pb-2">Użytkownik</th>
              <th className="pb-2">E-mail</th>
              <th className="pb-2">Rola</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="group border-t border-white/10 hover:bg-background-3/40"
              >
                <td className="py-3 text-[14px]">
                  <div className="flex flex-col">
                    <span className="text-foreground group-hover:text-accent">
                      {u.username}
                    </span>
                    {u.nick && u.nick !== u.username && (
                      <span className="text-[12px] text-foreground group-hover:text-accent">
                        @{u.nick}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 text-[14px] text-foreground-2">
                  {u.email}
                </td>
                <td className="py-3 text-[14px]">
                  <select
                    value={u.role}
                    disabled={!canManageUser(u) || busyIds[u.id]}
                    onChange={(e) => updateRole(u.id, e.target.value as Role)}
                    className="rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-[13px] text-foreground outline-none disabled:opacity-60"
                  >
                    <option value={Roles.NORMAL}>NORMAL</option>
                    <option value={Roles.ADMIN}>ADMIN</option>
                    {viewer.role === Roles.OWNER && (
                      <option value={Roles.OWNER}>OWNER</option>
                    )}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toastMessage && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 rounded-xl border border-white/10 bg-background-4/90 px-4 py-2 text-sm text-foreground shadow-2xl animate-toast">
          {toastMessage}
        </div>
      )}
    </>
  );
}



