import prisma from "@/lib/prisma";
import { DEFAULT_INFO_ENTRIES } from "./informacjeDefaults";
import {
  isInfoCategory,
  normalizeInfoDate,
  splitInfoContent,
  type InfoEntry,
} from "./informacjeTypes";

const INFO_SETTINGS_KEY = "infoEntries";
const INFO_SEED_KEY = "infoEntriesSeeded";

const safeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const ensureSeedFlag = async () => {
  await prisma.siteSetting.upsert({
    where: { key: INFO_SEED_KEY },
    update: { value: "true" },
    create: { key: INFO_SEED_KEY, value: "true" },
  });
};

const sortEntries = (entries: InfoEntry[]) => {
  return [...entries].sort((a, b) => {
    const aTime = Date.parse(a.publishedAt);
    const bTime = Date.parse(b.publishedAt);
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
};

const normalizeEntry = (raw: any): InfoEntry | null => {
  if (!raw || typeof raw !== "object") return null;
  const id = safeText(raw.id);
  const title = safeText(raw.title);
  const category = safeText(raw.category);
  if (!id || !title || !isInfoCategory(category)) return null;

  const content = Array.isArray(raw.content)
    ? raw.content
        .map((item: unknown) => safeText(String(item ?? "")))
        .filter(Boolean)
    : typeof raw.content === "string"
      ? splitInfoContent(raw.content)
      : [];

  const summary =
    safeText(raw.summary) ||
    (content.length > 0 ? content[0].slice(0, 160) : "") ||
    title;

  const author = safeText(raw.author) || "Administrator";
  const highlight = safeText(raw.highlight);

  return {
    id,
    title,
    summary,
    author,
    category,
    highlight: highlight || null,
    content,
    publishedAt: normalizeInfoDate(raw.publishedAt ?? raw.date),
  };
};

const parseEntries = (value?: string | null): InfoEntry[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter(Boolean) as InfoEntry[];
  } catch {
    return [];
  }
};

export async function setInfoEntries(entries: InfoEntry[]) {
  const sorted = sortEntries(entries);
  await prisma.siteSetting.upsert({
    where: { key: INFO_SETTINGS_KEY },
    update: { value: JSON.stringify(sorted) },
    create: { key: INFO_SETTINGS_KEY, value: JSON.stringify(sorted) },
  });
  await ensureSeedFlag();
  return sorted;
}

export async function listInfoEntries() {
  const [rawEntries, seedFlag] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: INFO_SETTINGS_KEY } }),
    prisma.siteSetting.findUnique({ where: { key: INFO_SEED_KEY } }),
  ]);

  const entries = parseEntries(rawEntries?.value ?? null);
  const seeded = seedFlag?.value === "true";

  if (entries.length === 0 && !seeded) {
    return setInfoEntries(DEFAULT_INFO_ENTRIES);
  }

  if (entries.length > 0 && !seeded) {
    await ensureSeedFlag();
  }

  return sortEntries(entries);
}
