import { listContentArchive } from "@/lib/admin";

import ArchiveList from "./ArchiveList";

export default async function AdminArchivePage() {
  const items = await listContentArchive();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Archiwum 24h</h1>
        <p className="text-sm text-foreground-2">
          Przywracaj usunięte treści w ciągu 24 godzin.
        </p>
      </header>

      <ArchiveList items={items} />
    </div>
  );
}
