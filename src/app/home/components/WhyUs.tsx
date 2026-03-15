import { Users, Award, MessageSquare, Map } from "lucide-react";

const features = [
  {
    icon: <Users size={32} />,
    title: "Aktywna społeczność",
    description:
      "Tysiące wędkarzy gotowych do pomocy i wymiany doświadczeń.",
  },
  {
    icon: <Award size={32} />,
    title: "Konkursy i nagrody",
    description: "Regularne zawody z cennymi nagrodami od naszych partnerów.",
  },
  {
    icon: <MessageSquare size={32} />,
    title: "Eksperckie forum",
    description:
      "Baza wiedzy tworzona latami. Znajdź odpowiedź na każde pytanie.",
  },
  {
    icon: <Map size={32} />,
    title: "Mapa łowisk",
    description:
      "Odkrywaj nowe miejscówki i sprawdzaj opinie o łowiskach w Twojej okolicy.",
  },
];

export default function WhyUs() {
  return (
    <section className="w-full py-20 bg-[var(--background-2)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
            Dlaczego warto do nas dołączyć?
          </h2>
          <p className="text-[var(--foreground-2)] max-w-2xl mx-auto">
            RybiaPaka.pl to więcej niż forum. To miejsce, gdzie pasja spotyka się
            z profesjonalizmem: uczysz się od mistrzów, bierzesz udział w zawodach,
            wymieniasz sprawdzone zestawy i planujesz kolejne wyprawy z ludźmi,
            którzy żyją wędkarstwem tak samo jak Ty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-[var(--background)] border border-[var(--background-3)] hover:border-[var(--accent)]/50 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-xl bg-[var(--background-3)] flex items-center justify-center text-[var(--accent)] mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">
                {feature.title}
              </h3>
              <p className="text-[var(--foreground-2)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
