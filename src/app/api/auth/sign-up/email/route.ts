import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

type SignUpPayload = {
  name?: string;
  email?: string;
  password?: string;
  username?: string;
  nick?: string;
};

type ExistingUser = {
  id: number;
  email: string;
  name: string;
  username: string | null;
  nick: string | null;
  passwordHash: string | null;
};

async function findUserByEmail(email: string): Promise<ExistingUser | null> {
  const normalized = email.trim().toLowerCase();
  return prisma.user.findFirst({
    where: { email: normalized },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      nick: true,
      passwordHash: true,
    },
  });
}

export async function POST(req: NextRequest) {
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

  const existingUser = await findUserByEmail(email);
  if (!existingUser) {
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

  const accountCount = await prisma.account.count({
    where: { userId: existingUser.id },
  });

  if (accountCount > 0) {
    return NextResponse.json(
      { message: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
      { status: 422 }
    );
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8) {
    return NextResponse.json(
      { message: "PASSWORD_TOO_SHORT" },
      { status: 422 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const updates: Prisma.UserUpdateInput = {
    email,
    passwordHash,
  };

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!existingUser.name && name) {
    updates.name = name;
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  if (!existingUser.username && username) {
    updates.username = username;
  }

  const nick = typeof body.nick === "string" ? body.nick.trim() : "";
  if (!existingUser.nick && nick) {
    updates.nick = nick;
  }

  try {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: updates,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "USERNAME_IS_ALREADY_TAKEN" },
        { status: 422 }
      );
    }
    throw error;
  }

  await prisma.account.create({
    data: {
      userId: existingUser.id,
      providerId: "credential",
      accountId: String(existingUser.id),
      password: passwordHash,
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
