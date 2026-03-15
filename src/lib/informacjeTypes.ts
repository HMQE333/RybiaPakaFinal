export const INFO_CATEGORY_KEYS = [
  "ogloszenia",
  "aktualnosci",
  "konkursy",
  "wydarzenia",
  "kulisy",
] as const;

export type InfoCategory = (typeof INFO_CATEGORY_KEYS)[number];

export type InfoEntry = {
  id: string;
  title: string;
  summary: string;
  author: string;
  category: InfoCategory;
  highlight?: string | null;
  content: string[];
  publishedAt: string;
};

export const INFO_CATEGORY_LABELS: Record<InfoCategory, string> = {
  ogloszenia: "Ogłoszenia",
  aktualnosci: "Aktualności",
  konkursy: "Konkursy",
  wydarzenia: "Wydarzenia",
  kulisy: "Kulisy developmentu",
};

export const INFO_CATEGORY_DESCRIPTIONS: Record<InfoCategory, string> = {
  ogloszenia: "Ważne komunikaty dla społeczności.",
  aktualnosci: "Nowości, funkcje, zmiany.",
  konkursy: "Wyzwania i nagrody.",
  wydarzenia: "Spotkania, live'y, warsztaty.",
  kulisy: "Devlog i roadmapa.",
};

export function isInfoCategory(value: string): value is InfoCategory {
  return INFO_CATEGORY_KEYS.includes(value as InfoCategory);
}

export function normalizeInfoDate(value?: string | Date | null): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value).trim();
  if (!raw) {
    return new Date().toISOString().slice(0, 10);
  }
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split(".");
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

export function formatInfoDate(value: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-");
    return `${day}.${month}.${year}`;
  }
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    return raw;
  }
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

export function splitInfoContent(value: string): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n{2,}/g)
    .map((chunk) => chunk.replace(/\r?\n/g, " ").trim())
    .filter(Boolean);
}

export function joinInfoContent(value: string[]): string {
  return value.map((entry) => entry.trim()).filter(Boolean).join("\n\n");
}
