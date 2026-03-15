import Link from "next/link";
import {
  HelpCircle,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  UserPlus,
  Camera,
} from "lucide-react";

import Page from "@/components/Page";

const FAQ_ITEMS = [
  {
    title: "Jak założyć konto?",
    description:
      "Kliknij Zarejestruj, podaj e-mail i hasło, a potem uzupełnij profil.",
    icon: UserPlus,
    tag: "Konto",
  },
  {
    title: "Jak ustawić avatar?",
    description:
      "Wejdź w Profil -> Ustawienia i wybierz plik lub podaj link do obrazu.",
    icon: Sparkles,
    tag: "Profil",
  },
  {
    title: "Jak dodać wątek na forum?",
    description:
      "Otwórz Forum, wybierz dział i kliknij przycisk dodania nowego wątku.",
    icon: MessageCircle,
    tag: "Forum",
  },
  {
    title: "Jak dodać zdjęcie do galerii?",
    description:
      "W Galerii wybierz Dodaj zdjęcie, uzupełnij opis i opublikuj wpis.",
    icon: Camera,
    tag: "Galeria",
  },
  {
    title: "Jak zgłosić problem?",
    description:
      "Skorzystaj z formularza Zgłoś problem w stopce lub w zakładce Kontakt.",
    icon: HelpCircle,
    tag: "Wsparcie",
  },
  {
    title: "Bezpieczeństwo i dane",
    description:
      "Dbamy o bezpieczeństwo konta, ale nie podawaj danych prywatnych w postach.",
    icon: ShieldCheck,
    tag: "Bezpieczeństwo",
  },
];

export default function FaqPage() {
  return (
    <Page>
      <main className="w-full flex flex-col items-center pt-[180px] pb-16 px-4">
        <section className="w-full max-w-6xl space-y-10">
          <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3 via-background-2 to-background-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)] px-6 md:px-10 py-10">
            <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_15%_20%,rgba(0,206,0,0.12),transparent_40%)]" />
            <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_85%_10%,rgba(0,133,0,0.14),transparent_40%)]" />
            <div className="relative space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-foreground-2">
                <span className="px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent">
                  FAQ
                </span>
                <span className="px-3 py-1 rounded-full border border-white/10 bg-background-4 text-foreground-2">
                  Pomoc i szybkie odpowiedzi
                </span>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Najczęstsze pytania
                </h1>
                <p className="text-base text-foreground-2 leading-relaxed max-w-3xl">
                  Zebrane odpowiedzi na najczęściej zadawane pytania o konto,
                  forum, galerię i bezpieczeństwo.
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-foreground-2">
                  {["Konto", "Forum", "Galeria", "Bezpieczeństwo"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            {FAQ_ITEMS.map((item) => (
              <article
                key={item.title}
                className="relative overflow-hidden rounded-2xl border border-background-4 bg-background-3/70 p-6 shadow-lg interactive-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/6 via-transparent to-background pointer-events-none" />
                <div className="relative space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
                      <item.icon size={18} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-2">
                        {item.tag}
                      </p>
                      <h2 className="text-lg font-semibold text-foreground">
                        {item.title}
                      </h2>
                    </div>
                  </div>
                  <p className="text-sm text-foreground-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-white/10 bg-background-3/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground-3">
                Nadal potrzebujesz pomocy?
              </p>
              <p className="text-sm text-foreground-2">
                Napisz do nas, a podpowiemy najlepsze rozwiązanie.
              </p>
            </div>
            <Link
              href="/kontakt"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-background-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground-2 transition hover:border-accent/50 hover:text-accent"
            >
              Kontakt
            </Link>
          </section>
        </section>
      </main>
    </Page>
  );
}
