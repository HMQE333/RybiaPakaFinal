const UPLOADS_PREFIX = "/uploads/";

function resolveUploadsPath(rawSrc: string) {
  if (!rawSrc) return null;
  if (rawSrc.startsWith(UPLOADS_PREFIX)) {
    return rawSrc;
  }

  try {
    const parsed = new URL(rawSrc, "http://localhost");
    if (parsed.pathname === "/_next/image") {
      const inner = parsed.searchParams.get("url");
      if (inner) {
        return resolveUploadsPath(inner);
      }
    }
    if (parsed.pathname.startsWith(UPLOADS_PREFIX)) {
      return parsed.pathname;
    }
  } catch {}

  return null;
}

function resetImageCandidates(img: HTMLImageElement) {
  img.removeAttribute("srcset");
  img.removeAttribute("sizes");
}

export function handleUploadImageError(
  img: HTMLImageElement,
  fallbackSrc: string
) {
  if (!img) return;

  const currentSrc = img.currentSrc || img.src || "";
  const normalized = resolveUploadsPath(currentSrc);
  const normalizedApplied = img.dataset.uploadNormalized === "1";
  const fallbackApplied = img.dataset.fallbackApplied === "1";

  if (normalized && !normalizedApplied && normalized !== img.src) {
    img.dataset.uploadNormalized = "1";
    resetImageCandidates(img);
    img.src = normalized;
    return;
  }

  if (fallbackApplied || !fallbackSrc || img.src === fallbackSrc) return;
  img.dataset.fallbackApplied = "1";
  resetImageCandidates(img);
  img.src = fallbackSrc;
}
