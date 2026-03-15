const sponsors = [
  { name: "FishMaster", logo: "🎣" },
  { name: "ProAngler", logo: "🏆" },
  { name: "Wędkarz Polski", logo: "🌊" },
  { name: "AquaGear", logo: "🧰" },
  { name: "NatureLure", logo: "🐟" },
];

export default function Sponsors() {
  return (
    <section className="w-full py-12 border-y border-[var(--background-3)] bg-[var(--background-2)]/50">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-center text-[var(--foreground-2)] text-sm font-medium mb-8 uppercase tracking-wider">
          Nasi partnerzy
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {sponsors.map((sponsor, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xl font-bold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors cursor-default"
            >
              <span className="text-3xl" aria-hidden>
                {sponsor.logo}
              </span>
              <span>{sponsor.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
