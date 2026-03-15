"use client";

import Link from "next/link";

import Logo from "@/components/Logo";
import Page from "@/components/Page";

export default function ErrorAuthPage() {
  return (
    <Page type="form" header={false}>
      <div className="w-[360px] max-w-full text-center space-y-4">
        <div className="flex flex-col items-center gap-3">
          <Logo size={64} />
          <h1 className="text-2xl font-semibold">Błąd autoryzacji</h1>
        </div>

        <p className="text-foreground-2 text-sm">
          Nie udało się zalogować przez zewnętrznego dostawcę. Spróbuj ponownie
          lub wybierz inną metodę logowania.
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href="/logowanie"
            className="rounded-xl bg-accent-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
          >
            Wróć do logowania
          </Link>
          <Link
            href="/kontakt"
            className="rounded-xl border border-white/10 bg-background-3 px-4 py-2 text-sm text-foreground-2 hover:text-foreground"
          >
            Kontakt
          </Link>
        </div>
      </div>
    </Page>
  );
}
