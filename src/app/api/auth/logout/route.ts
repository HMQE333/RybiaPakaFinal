import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/lib/auth";

const AUTH_COOKIE_PREFIXES = [
  "better-auth",
  "__Secure-better-auth",
  "__Host-better-auth",
];

function shouldClearCookie(name: string) {
  return AUTH_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function isSecureCookie(name: string) {
  return name.startsWith("__Secure-") || name.startsWith("__Host-");
}

export async function POST(req: NextRequest) {
  await auth.api.signOut({ headers: req.headers }).catch(() => null);

  const response = NextResponse.json({ success: true });
  const requestCookies = (await cookies()).getAll();

  for (const cookie of requestCookies) {
    if (!shouldClearCookie(cookie.name)) continue;

    response.cookies.set({
      name: cookie.name,
      value: "",
      maxAge: 0,
      path: "/",
      secure: isSecureCookie(cookie.name),
    });
  }

  response.headers.set("Cache-Control", "no-store");
  return response;
}
