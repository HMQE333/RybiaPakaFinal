import { getSiteSettings, updateSiteSettings } from "@/lib/admin";
import { headers } from "next/headers";
import { requireAdminFromHeaders } from "@/lib/adminAccess";

export default async function SettingsAdminPage() {
  const settings = await getSiteSettings();

  async function saveSettings(formData: FormData) {
    "use server";
    const headerList = await headers();
    const viewer = await requireAdminFromHeaders(headerList as unknown as Headers);
    const siteName =
      formData.get("siteName")?.toString().trim() || "RybiaPaka.pl";
    const maintenance = formData.get("maintenance") === "on";
    const headerBadge = formData.get("headerBadge")?.toString().trim() ?? "";

    await updateSiteSettings({
      siteName,
      maintenance,
      headerBadge,
      actorId: viewer.id,
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Ustawienia</h1>
        <p className="text-sm text-foreground-2">
          Podstawowe ustawienia serwisu.
        </p>
      </header>

      <form
        action={saveSettings}
        className="rounded-2xl border border-white/10 bg-background-2 p-4"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm text-foreground-2">Nazwa strony</label>
          <input
            name="siteName"
            defaultValue={settings.siteName}
            className="rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-[14px] outline-none focus:border-accent/40"
          />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <label className="text-sm text-foreground-2">Nagłówek</label>
          <input
            name="headerBadge"
            defaultValue={settings.headerBadge ?? ""}
            className="rounded-xl border border-white/10 bg-background-3 px-3 py-2 text-[14px] outline-none focus:border-accent/40"
          />
          <p className="text-xs text-foreground-2">
            Puste pole ukrywa nagłówek na stronie.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-background-3 px-3 py-3">
          <div className="pr-4">
            <p className="font-medium">Tryb konserwacji</p>
            <p className="text-sm text-foreground-2">
              Włącz, aby zablokować serwis dla zwykłych użytkowników (admin ma
              dostęp).
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="maintenance"
              defaultChecked={settings.maintenance}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-background-4 peer-checked:bg-accent transition-colors" />
            <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white/90 transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="submit"
            className="rounded-xl bg-accent-2 px-4 py-2 text-black hover:bg-accent"
          >
            Zapisz
          </button>
          <button
            type="reset"
            className="rounded-xl border border-white/10 bg-background-3 px-4 py-2 text-foreground-2 hover:text-foreground"
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
