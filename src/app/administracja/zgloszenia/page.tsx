import { listReports } from "@/lib/admin";
import ReportsList from "./ReportsList";

export default async function ReportsAdminPage() {
  const reports = await listReports();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Zgłoszenia</h1>
        <p className="text-sm text-foreground-2">
          Lista zgłoszeń od użytkowników. Przeglądaj i rozpatruj nowe sprawy.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-background-2 p-4">
        <ReportsList reports={reports} />
      </section>
    </div>
  );
}
