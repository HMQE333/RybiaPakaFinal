const DEFAULT_TIMEOUT_MS = 8_000;

export function isDataServiceConfigured() {
  return Boolean(process.env.DATA_BASE_URL && process.env.DATA_SERVICE_TOKEN);
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name}_MISSING`);
  }
  return value;
}

export async function dataFetch(
  pathname: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
) {
  const base = getRequiredEnv("DATA_BASE_URL");
  const token = getRequiredEnv("DATA_SERVICE_TOKEN");
  const url = new URL(pathname, base);

  const headers = new Headers(options.headers || {});
  headers.set("x-service-token", token);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`DATA_REQUEST_FAILED_${response.status}`);
    }
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function dataRpc<T>(
  payload: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const response = await dataFetch(
    "/rpc/prisma",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
    timeoutMs
  );

  let json: { ok?: boolean; result?: T; error?: string };
  try {
    json = (await response.json()) as { ok?: boolean; result?: T; error?: string };
  } catch {
    throw new Error("DATA_RPC_INVALID_JSON");
  }
  if (!json?.ok) {
    throw new Error(json?.error || "DATA_RPC_FAILED");
  }
  return json.result as T;
}
