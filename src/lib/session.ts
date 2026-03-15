import crypto from "node:crypto";

const SECRET =
  process.env.AUTH_SECRET ||
  process.env.BETTER_AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "dev-secret-change-me";

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);

  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function signPayload(
  payload: Record<string, any>,
  maxAgeSec = 60 * 60 * 24 * 30
) {
  const data = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + maxAgeSec,
  };

  const body = b64url(JSON.stringify(data));

  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("base64url");

  return `${body}.${sig}`;
}

export function verifyPayload(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [body, sig] = token.split(".");

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("base64url");

  if (expected !== sig) {
    return null;
  }

  try {
    const json = JSON.parse(Buffer.from(body, "base64").toString("utf8"));

    if (json.exp && Date.now() / 1000 > json.exp) {
      return null;
    }

    return json;
  } catch {
    return null;
  }
}

export function buildSessionCookie(
  token: string,
  maxAgeSec = 60 * 60 * 24 * 30
) {
  const isProd = process.env.NODE_ENV === "production";

  return `app_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}; ${
    isProd ? "Secure;" : ""
  }`;
}
