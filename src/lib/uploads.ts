import path from "node:path";

const DEFAULT_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const UPLOADS_DIR = (process.env.UPLOADS_DIR || DEFAULT_UPLOADS_DIR).trim();
const UPLOADS_PREFIX = "/uploads/";

const resolvedUploadsDir = path.resolve(UPLOADS_DIR);

export function getUploadsRoot() {
  return UPLOADS_DIR;
}

export function getUploadsDir(...segments: string[]) {
  return path.join(UPLOADS_DIR, ...segments);
}

export function buildUploadUrl(...segments: string[]) {
  const cleaned = segments
    .filter(Boolean)
    .map((segment) => segment.replace(/^\/+|\/+$/g, ""));
  return `/${["uploads", ...cleaned].join("/")}`;
}

export function resolveUploadsPathFromUrl(value?: string | null) {
  if (!value) return null;
  let pathname = value.trim();
  if (!pathname) return null;

  if (/^https?:\/\//i.test(pathname)) {
    try {
      pathname = new URL(pathname).pathname;
    } catch {
      return null;
    }
  }

  if (!pathname.startsWith(UPLOADS_PREFIX)) {
    return null;
  }

  const relative = pathname.slice(UPLOADS_PREFIX.length);
  const resolved = path.resolve(resolvedUploadsDir, relative);
  const rootWithSep = `${resolvedUploadsDir}${path.sep}`;
  if (resolved !== resolvedUploadsDir && !resolved.startsWith(rootWithSep)) {
    return null;
  }

  return resolved;
}
