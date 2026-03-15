import { listUsers } from "@/lib/admin";
import UsersTable from "./UsersTable";

export default async function UsersAdminPage() {
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Użytkownicy</h1>
        <p className="text-sm text-foreground-2">
          Zmieniaj role użytkowników.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-background-2 p-4">
        <UsersTable users={users} />
      </section>
    </div>
  );
}
