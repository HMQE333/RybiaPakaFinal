const DEFAULT_TIMEOUT_MS = 12_000;

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name}_MISSING`);
  }
  return value;
}

export async function galleryUpload(
  formData: FormData,
  timeoutMs = DEFAULT_TIMEOUT_MS
) {
  const base = getRequiredEnv("GALLERY_BASE_URL");
  const token = getRequiredEnv("GALLERY_SERVICE_TOKEN");
  const url = new URL("/upload", base);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-service-token": token,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`GALLERY_REQUEST_FAILED_${response.status}`);
    }

    return response.json() as Promise<{ url: string; item?: unknown }>;
  } finally {
    clearTimeout(timeout);
  }
}
