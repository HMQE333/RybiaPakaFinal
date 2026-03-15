import prisma from "@/lib/prisma";

export type ReviewEntry = {
  id: string;
  name: string;
  subtitle: string;
  body: string;
  avatarUrl?: string | null;
};

const REVIEWS_KEY = "homeReviews";
const REVIEWS_SEED_KEY = "homeReviewsSeeded";

const DEFAULT_REVIEWS: ReviewEntry[] = [
  {
    id: "review-001",
    name: "Alicja Kowalska",
    subtitle: "Pozna\u0144 - 6 lat w spo\u0142eczno\u015Bci",
    body:
      "\u015Awietna spo\u0142eczno\u015B\u0107 i szybka pomoc na forum. W\u0105tki s\u0105 konkretne, a odpowiedzi rzeczowe.",
    avatarUrl: null,
  },
  {
    id: "review-002",
    name: "Micha\u0142 Nowak",
    subtitle: "Gda\u0144sk - relacje z wypraw",
    body:
      "Galeria dzia\u0142a szybko, a dodawanie zdj\u0119\u0107 jest proste. Lubi\u0119 przegl\u0105da\u0107 nowe okazy.",
    avatarUrl: null,
  },
  {
    id: "review-003",
    name: "Zofia Wi\u015Bniewska",
    subtitle: "Mazury - 3 sezony aktywno\u015Bci",
    body:
      "Informacje s\u0105 czytelne i zawsze na czas. Wida\u0107, \u017Ce serwis jest rozwijany.",
    avatarUrl: null,
  },
  {
    id: "review-004",
    name: "Eryk D\u0105browski",
    subtitle: "\u015Al\u0105sk - w\u0119dkarz spinningowy",
    body:
      "Podoba mi si\u0119 klimat i tematy na forum. Du\u017Co praktycznej wiedzy i brak spamu.",
    avatarUrl: null,
  },
  {
    id: "review-005",
    name: "Oliwia W\u00F3jcik",
    subtitle: "Podkarpacie - aktywna na forum",
    body:
      "Szybka moderacja i mi\u0142a atmosfera. Fajnie, \u017Ce s\u0105 konkursy i wyzwania.",
    avatarUrl: null,
  },
  {
    id: "review-006",
    name: "Kacper Lewandowski",
    subtitle: "Warszawa - sprz\u0119t i poradniki",
    body:
      "Poradniki i relacje motywuj\u0105 do wyj\u015Bcia nad wod\u0119. To moje codzienne \u017Ar\u00F3d\u0142o inspiracji.",
    avatarUrl: null,
  },
];

const safeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeReview = (raw: unknown): ReviewEntry | null => {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const id = safeText(data.id);
  const name = safeText(data.name);
  const subtitle = safeText(data.subtitle);
  const body = safeText(data.body ?? data.review ?? data.text);
  if (!id || !name || !body) return null;

  const avatarUrl = safeText(data.avatarUrl);

  return {
    id,
    name,
    subtitle: subtitle || "U\u017Cytkownik",
    body,
    avatarUrl: avatarUrl || null,
  };
};

const parseReviews = (value?: string | null): ReviewEntry[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeReview).filter(Boolean) as ReviewEntry[];
  } catch {
    return [];
  }
};

const ensureSeedFlag = async () => {
  await prisma.siteSetting.upsert({
    where: { key: REVIEWS_SEED_KEY },
    update: { value: "true" },
    create: { key: REVIEWS_SEED_KEY, value: "true" },
  });
};

export async function setReviews(entries: ReviewEntry[]) {
  const cleaned = entries
    .map((entry) => normalizeReview(entry))
    .filter(Boolean) as ReviewEntry[];

  await prisma.siteSetting.upsert({
    where: { key: REVIEWS_KEY },
    update: { value: JSON.stringify(cleaned) },
    create: { key: REVIEWS_KEY, value: JSON.stringify(cleaned) },
  });
  await ensureSeedFlag();
  return cleaned;
}

export async function listReviews() {
  const [rawReviews, seedFlag] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: REVIEWS_KEY } }),
    prisma.siteSetting.findUnique({ where: { key: REVIEWS_SEED_KEY } }),
  ]);

  const reviews = parseReviews(rawReviews?.value ?? null);
  const seeded = seedFlag?.value === "true";

  if (reviews.length === 0 && !seeded) {
    return setReviews(DEFAULT_REVIEWS);
  }

  if (reviews.length > 0 && !seeded) {
    await ensureSeedFlag();
  }

  return reviews;
}
