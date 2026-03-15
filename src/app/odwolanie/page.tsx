import Link from "next/link";

import Page from "@/components/Page";

export default function OdwolaniePage() {
  return (
    <Page>
      <div className="w-full max-w-3xl px-4 py-24">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Odwo\u0142anie od decyzji moderacyjnej
          </h1>
          <p className="text-sm text-foreground-2">
            Je\u015bli uwa\u017casz, \u017ce blokada konta zosta\u0142a
            na\u0142o\u017cona b\u0142\u0119dnie, mo\u017cesz si\u0119
            odwo\u0142a\u0107. Poni\u017cej znajdziesz kroki i informacje,
            kt\u00f3re przyspiesz\u0105 weryfikacj\u0119.
          </p>
        </header>

        <section className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-background-2 p-5">
          <h2 className="text-lg font-semibold text-foreground">
            Jak zlo\u017cy\u0107 odwo\u0142anie
          </h2>
          <ol className="list-decimal pl-5 text-sm text-foreground-2 space-y-2">
            <li>Skontaktuj si\u0119 z nami przez formularz lub e-mail.</li>
            <li>
              Podaj e-mail konta, nick (je\u015bli posiadasz) oraz kr\u00f3tki opis sytuacji.
            </li>
            <li>
              Wyt\u0142umacz, dlaczego uwa\u017casz decyzj\u0119 za nies\u0142uszn\u0105
              i do\u0142\u0105cz dowody.
            </li>
          </ol>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/kontakt"
              className="rounded-xl bg-accent-2 px-4 py-2 text-sm text-black hover:bg-accent"
            >
              Przejd\u017a do kontaktu
            </Link>
            <a
              href="mailto:rybiapaka@gmail.com"
              className="rounded-xl border border-white/10 bg-background-3 px-4 py-2 text-sm text-foreground-2 hover:text-foreground"
            >
              rybiapaka@gmail.com
            </a>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-background-3 p-5">
          <h3 className="text-sm font-semibold tracking-wide text-foreground">
            Co warto poda\u0107
          </h3>
          <ul className="mt-3 list-disc pl-5 text-sm text-foreground-2 space-y-2">
            <li>Adres e-mail przypisany do konta.</li>
            <li>Tw\u00f3j nick lub nazwa u\u017cytkownika.</li>
            <li>Opis zdarzenia i kontekst.</li>
            <li>Dowody: zrzuty ekranu, linki, data zdarzenia.</li>
          </ul>
        </section>
      </div>
    </Page>
  );
}
