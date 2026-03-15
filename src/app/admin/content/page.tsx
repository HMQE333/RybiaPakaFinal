import { listContentQueue, listUsers } from "@/lib/admin";
import ContentList from "./ContentList";
import UsersTable from "@/app/administracja/uzytkownicy/UsersTable";

export default async function ContentAdminPage() {
  const [items, users] = await Promise.all([listContentQueue(), listUsers()]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Moderacja</h1>
        <p className="text-sm text-foreground-2">
          Przeglądaj zgłoszenia treści i podejmuj decyzje moderacyjne.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-background-2 p-4">
        <div className="mb-4 space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Użytkownicy
          </h2>
          <p className="text-sm text-foreground-2">
            Zmieniaj role kont.
          </p>
        </div>
        <UsersTable users={users} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-background-2 p-4">
        <ContentList items={items} />
      </section>
    </div>
  );
}
