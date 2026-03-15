import { listLogs } from "@/lib/admin";
import LogsList from "./LogsList";

export default async function LogsAdminPage() {
  const logs = await listLogs();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Logi</h1>
        <p className="text-sm text-foreground-2">
          Historia działań administracyjnych i zdarzeń systemowych.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-background-2 p-4">
        <LogsList logs={logs} />
      </section>
    </div>
  );
}
