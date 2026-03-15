"use client";

import { LucideSearch, LucideUser } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type UserOption = {
  id: number;
  label: string;
  email: string;
};

type UserSelectProps = {
  users: UserOption[];
  selectedUserId: number | null;
};

export default function UserSelect({ users, selectedUserId }: UserSelectProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(selectedUserId);

  useEffect(() => {
    setSelectedId(selectedUserId);
  }, [selectedUserId]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) return users;
    return users.filter((user) => {
      const haystack = `${user.label} ${user.email}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, users]);

  const countLabel = normalizedQuery
    ? `Znaleziono ${filteredUsers.length} z ${users.length}`
    : `Dostępnych ${users.length} użytkowników`;

  const selectedUser = users.find((user) => user.id === selectedId) ?? null;
  const selectedLabel = selectedUser
    ? `${selectedUser.label} (${selectedUser.email})`
    : selectedId
      ? `Użytkownik #${selectedId}`
      : "Ogólne statystyki (średnia)";

  const handleSelect = (id: number | null) => {
    setSelectedId(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-3">
          Wybór użytkownika
        </label>
        <span className="text-[11px] text-foreground-3">{countLabel}</span>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-background-3/60 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-background-2/80 px-3 py-2">
          <LucideSearch size={16} className="text-foreground-3" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj po nazwie lub e-mailu"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-3/70 outline-none"
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-background-2/80 px-3 py-2">
          <LucideUser size={16} className="text-foreground-3 mt-0.5" />
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-3">
              Wybrane
            </p>
            <p className="text-sm text-foreground truncate">{selectedLabel}</p>
          </div>
          {selectedId !== null && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="ml-auto text-[11px] uppercase tracking-[0.18em] text-foreground-3 transition hover:text-accent"
            >
              Wyczyść
            </button>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-background-2/70 p-2">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
              selectedId === null
                ? "border-accent/40 bg-accent/10 text-foreground"
                : "border-white/10 bg-background-3/60 text-foreground-2 hover:border-accent/40 hover:text-foreground"
            }`}
          >
            Ogólne statystyki (średnia)
          </button>

          <div className="custom-scrollbar mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
            {filteredUsers.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-background-3/60 px-3 py-2 text-xs text-foreground-2">
                Brak wyników wyszukiwania.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedId === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      isSelected
                        ? "border-accent/40 bg-accent/10 text-foreground"
                        : "border-white/10 bg-background-3/60 text-foreground-2 hover:border-accent/40 hover:text-foreground"
                    }`}
                  >
                    <div className="text-sm font-medium">{user.label}</div>
                    <div className="text-[11px] text-foreground-3">
                      {user.email}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <input type="hidden" name="user" value={selectedId ? String(selectedId) : ""} />
    </div>
  );
}
