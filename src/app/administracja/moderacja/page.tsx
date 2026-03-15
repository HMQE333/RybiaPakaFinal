import { listUsers } from "@/lib/admin";
import ModerationActionMenu from "./ModerationActionMenu";

export default async function ModerationPage() {
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Moderacja osób</h1>
        <p className="text-sm text-foreground-2">
          Szybkie menu do moderacji kont.
        </p>
      </header>

      <ModerationActionMenu users={users} />
    </div>
  );
}
