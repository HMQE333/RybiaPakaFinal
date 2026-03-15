export type StatItem = {
  label: string;
  value: string;
};

interface Props {
  stats: StatItem[];
}

export default function Statistics({ stats }: Props) {
  return (
    <section className="w-full py-12 bg-[#070a07] border-y border-[var(--background-3)] shadow-[0_-10px_40px_rgba(0,0,0,0.45)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center gap-2"
            >
              <span className="text-3xl md:text-4xl font-extrabold text-[var(--accent)]">
                {stat.value}
              </span>
              <span className="text-[var(--foreground-2)] font-semibold uppercase tracking-[0.12em] text-xs">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
