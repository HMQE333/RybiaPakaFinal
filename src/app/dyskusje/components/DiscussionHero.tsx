export default function DiscussionHero() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3 via-background-2 to-background-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 opacity-50 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(0,206,0,0.14),transparent_35%)]" />
      <div className="absolute inset-0 opacity-50 blur-3xl bg-[radial-gradient(circle_at_80%_10%,rgba(0,150,255,0.12),transparent_35%)]" />
      <div className="relative px-6 md:px-10 py-10 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground-2">
          <span className="px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent">
            Dyskusje na żywo
          </span>
          <span className="px-3 py-1 rounded-full border border-white/10 bg-background-4 text-foreground-2">
            Metody wędkarskie
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Wybierz metodę łowienia i wskocz na czat
            </h1>
            <p className="max-w-3xl text-base md:text-lg text-foreground-2">
              Każda metoda wędkarska ma swój dedykowany kanał dyskusyjny.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
