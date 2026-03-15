export type ThreadMetaItem = {
  label: string;
  value: string;
};

export type ThreadContentParts = {
  body: string;
  meta: ThreadMetaItem[];
  pollOptions: string[];
};

const META_HEADER_RE = /^metryka\b/i;
const POLL_HEADER_RE = /^ankieta\b/i;
const BULLET_RE = /^[-*]\s+(.*)$/;

function stripBullet(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return "";
  const match = BULLET_RE.exec(trimmed);
  return (match?.[1] ?? trimmed).trim();
}

function parseMetaLine(line: string): ThreadMetaItem | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex === -1) {
    return { label: trimmed, value: "" };
  }
  const label = trimmed.slice(0, colonIndex).trim();
  const value = trimmed.slice(colonIndex + 1).trim();
  if (!label && !value) return null;
  return { label, value };
}

export function parseThreadContent(content: string): ThreadContentParts {
  const lines = content.split(/\r?\n/);
  const metaLines: string[] = [];
  const pollLines: string[] = [];
  const bodyLines: string[] = [];
  let section: "meta" | "poll" | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (section) {
        section = null;
      } else {
        bodyLines.push("");
      }
      continue;
    }

    const lower = trimmed.toLowerCase();
    if (META_HEADER_RE.test(lower)) {
      section = "meta";
      continue;
    }
    if (POLL_HEADER_RE.test(lower)) {
      section = "poll";
      continue;
    }

    if (section === "meta") {
      const item = stripBullet(line);
      if (item) metaLines.push(item);
      continue;
    }
    if (section === "poll") {
      const option = stripBullet(line);
      if (option) pollLines.push(option);
      continue;
    }

    bodyLines.push(line);
  }

  const meta = metaLines
    .map(parseMetaLine)
    .filter((item): item is ThreadMetaItem => Boolean(item));
  const pollOptions = pollLines.map((option) => option.trim()).filter(Boolean);
  const body = bodyLines.join("\n").trim();

  return {
    body,
    meta,
    pollOptions: pollOptions.length >= 2 ? pollOptions : [],
  };
}

export function extractTags(meta: ThreadMetaItem[]): string[] {
  const tagsItem = meta.find((item) =>
    item.label.toLowerCase().startsWith("tag")
  );
  if (!tagsItem?.value) return [];
  return tagsItem.value
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);
}

export function filterMeta(meta: ThreadMetaItem[]): ThreadMetaItem[] {
  return meta.filter(
    (item) =>
      !item.label.toLowerCase().startsWith("tag") &&
      !item.label.toLowerCase().startsWith("link")
  );
}
