import InformacjePanel from "./InformacjePanel";

export default function InformacjeAdminPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Informacje</h1>
        <p className="text-sm text-foreground-2">
          Zarządzaj wpisami widocznymi na stronie Informacje.
        </p>
      </header>

      <InformacjePanel />
    </div>
  );
}
