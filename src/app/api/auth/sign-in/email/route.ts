import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignInPayload = {
  email?: string;
  password?: string;
} & Record<string, unknown>;

type UserLookup = {
  id: number;
  passwordHash: string | null;
};

async function findUserByEmail(normalized: string): Promise<UserLookup | null> {
  return prisma.user.findFirst({
    where: { email: normalized },
    select: { id: true, passwordHash: true },
  });
}

async function ensureCredentialAccount(
  normalized: string,
  user: UserLookup | null
) {
  if (!normalized) return;
  if (!user) return;

  if (!user?.passwordHash) return;

  const existing = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { id: true },
  });

  if (existing) return;

  await prisma.account.create({
    data: {
      userId: user.id,
      providerId: "credential",
      accountId: String(user.id),
      password: user.passwordHash,
    },
  });
}

async function getCredentialPassword(userId: number) {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { password: true },
  });
  return account?.password ?? null;
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  let body: SignInPayload;

  try {
    body = JSON.parse(bodyText) as SignInPayload;
  } catch {
    return NextResponse.json({ message: "INVALID_BODY" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ message: "INVALID_BODY" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ message: "INVALID_BODY" }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ message: "INVALID_EMAIL" }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ message: "ACCOUNT_NOT_FOUND" }, { status: 404 });
  }

  const accountPassword = await getCredentialPassword(user.id);
  const passwordHash = accountPassword ?? user.passwordHash;
  if (!passwordHash) {
    return NextResponse.json(
      { message: "ACCOUNT_NO_PASSWORD" },
      { status: 400 }
    );
  }

  const isValid = await bcrypt.compare(password, passwordHash);
  if (!isValid) {
    return NextResponse.json({ message: "INVALID_PASSWORD" }, { status: 401 });
  }

  await ensureCredentialAccount(email, user);
  body.email = email;
  body.password = password;

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
