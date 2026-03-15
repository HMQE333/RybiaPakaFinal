import Link from "next/link";
import { ArrowRight } from "lucide-react";

import prisma from "@/lib/prisma";

const MAX_EXCERPT_LENGTH = 160;

type ThreadPreview = {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  createdAt: string;
};

const formatExcerpt = (value: string) => {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= MAX_EXCERPT_LENGTH) return clean;
  return `${clean.slice(0, MAX_EXCERPT_LENGTH - 1).trim()}…`;
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
  }).format(value);

async function fetchThreads(): Promise<ThreadPreview[]> {
  const threads = await prisma.thread.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      author: {
        select: { username: true, nick: true, name: true },
      },
    },
  });

  return threads
    .map((thread) => {
      const author =
        thread.author?.username ||
        thread.author?.nick ||
        thread.author?.name ||
        "Gość";
      const excerpt = formatExcerpt(thread.content ?? "");
      if (!excerpt) return null;
      return {
        id: thread.id,
        title: thread.title,
        excerpt,
        author,
        createdAt: formatDate(new Date(thread.createdAt)),
      };
    })
    .filter(Boolean) as ThreadPreview[];
}

export default async function Tutorials() {
  const threads = await fetchThreads();
  if (threads.length === 0) return null;

  return (
    <section className="w-full py-16 px-4 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
            Nowe dyskusje i poradniki
          </h2>
          <p className="text-lg text-[var(--foreground-2)]">
            Najświeższe wątki od społeczności: pytania, relacje z wypraw i
            praktyczne porady sprzętowe.
          </p>
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 text-[var(--accent)] font-semibold"
          >
            Wejdź na forum <ArrowRight size={20} />
          </Link>
        </div>

        <div className="flex-1 w-full max-w-2xl">
          <div className="rounded-2xl border border-white/10 bg-background-2/70 shadow-2xl p-6 space-y-4">
            {threads.map((thread) => (
              <article
                key={thread.id}
                className="rounded-xl border border-white/10 bg-background/60 p-4 space-y-2"
              >
                <div className="text-xs uppercase tracking-wide text-foreground-2">
                  {thread.author} · {thread.createdAt}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {thread.title}
                </h3>
                <p className="text-sm text-foreground-2">{thread.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
