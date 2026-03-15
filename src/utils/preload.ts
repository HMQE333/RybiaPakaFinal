export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url || typeof Image === "undefined") {
      resolve();
      return;
    }

    const img = new Image();

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };

    img.onload = () => {
      cleanup();
      resolve();
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("IMAGE_LOAD_FAILED"));
    };

    img.decoding = "async";
    img.src = url;
  });
}

export async function preloadCriticalAssets(urls: string[]): Promise<void> {
  const unique = Array.from(new Set(urls.filter(Boolean)));
  if (unique.length === 0) return;
  await Promise.allSettled(unique.map((url) => preloadImage(url)));
}
