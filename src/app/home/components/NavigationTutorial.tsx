import Link from "next/link";

const tutorialVideo = ""; // brak materiału wideo na ten moment

export default function NavigationTutorial() {
  return (
    <section className="w-full py-16 px-4 bg-[var(--background-2)]">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
            Jak poruszać się po stronie?
          </h2>
          <p className="text-lg text-[var(--foreground-2)] max-w-2xl mx-auto">
            Przygotowujemy wideo onboardingowe. Do czasu publikacji możesz
            skorzystać z krótkiego przewodnika i zgłosić pomysł na materiał, który
            najbardziej Ci pomoże.
          </p>
        </div>

        <div className="w-full max-w-4xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-[var(--background)] flex items-center justify-center">
            {tutorialVideo ? (
              <iframe
                src={tutorialVideo}
                title="Navigation Tutorial"
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
            ) : (
              <div className="flex flex-col items-center gap-4 p-10 text-center">
                <p className="text-xl font-semibold text-[var(--foreground)]">
                  Wideo w drodze
                </p>
                <p className="text-[var(--foreground-2)] max-w-md">
                  Pracujemy nad materiałem wideo. Napisz, czego potrzebujesz w
                  pierwszej kolejności, a damy znać gdy będzie gotowe.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/informacje"
                    className="px-5 py-2 rounded-full bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-2)] transition"
                  >
                    Krótki przewodnik
                  </Link>
                  <Link
                    href="/zglos-problem"
                    className="px-5 py-2 rounded-full border border-[var(--background-4)] text-[var(--foreground)] hover:bg-[var(--background-3)] transition"
                  >
                    Zgłoś temat wideo
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
