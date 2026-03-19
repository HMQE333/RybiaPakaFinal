import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp, AUTH_RULES } from "@/lib/rateLimiter";

export const runtime = "nodejs";

type SignUpPayload = {
  name?: string;
  email?: string;
  password?: string;
  username?: string;
  nick?: string;
};

async function emailExists(email: string): Promise<boolean> {
  const count = await prisma.user.count({ where: { email } });
  return count > 0;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip, "sign-up", AUTH_RULES.signUp);
  if (!limit.allowed) {
    const retryAfterSec = Math.ceil(limit.retryAfterMs / 1000);
    return NextResponse.json(
      { message: "TOO_MANY_REQUESTS" },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  const bodyText = await req.text();
  let body: SignUpPayload;

  try {
    body = JSON.parse(bodyText) as SignUpPayload;
  } catch {
    return NextResponse.json({ message: "INVALID_BODY" }, { status: 400 });
  }

  if (typeof body.email === "string") {
    body.email = body.email.trim().toLowerCase();
  }

  const email = body.email ?? "";
  if (!email) {
    return NextResponse.json({ message: "INVALID_EMAIL" }, { status: 400 });
  }

  const exists = await emailExists(email);
  if (!exists) {
    const headers = new Headers(req.headers);
    headers.set("content-type", "application/json");
    headers.delete("content-length");

    const forwardRequest = new Request(req.url, {
      method: req.method,
      headers,
      body: JSON.stringify(body),
    });

    return auth.handler(forwardRequest);
  }

  return NextResponse.json(
    { message: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
    { status: 422 }
  );
}
