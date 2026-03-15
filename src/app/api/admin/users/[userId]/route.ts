import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { AdminAuthError, requireAdminFromHeaders } from "@/lib/adminAccess";
import { Role } from "@/lib/prismaEnums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseUserId(raw: string) {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isValidRole(value: string) {
  return (Object.values(Role) as string[]).includes(value);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } | Promise<{ userId: string }> }
) {
  const { userId: rawUserId } = await params;
  const userId = parseUserId(rawUserId);
  if (!userId) return jsonError("INVALID_USER", 400);

  let viewer;
  try {
    viewer = await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", 400);
  }

  const role = String(body?.role ?? "").trim().toUpperCase();
  if (!role || !isValidRole(role)) {
    return jsonError("INVALID_ROLE", 422);
  }

  if (viewer.id === userId) {
    return jsonError("CANNOT_EDIT_SELF", 400);
  }

  if (role === Role.OWNER && viewer.role !== Role.OWNER) {
    return jsonError("FORBIDDEN", 403);
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!target) return jsonError("USER_NOT_FOUND", 404);

  if (target.role === Role.OWNER && viewer.role !== Role.OWNER) {
    return jsonError("FORBIDDEN", 403);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, username: true, nick: true, role: true },
  });

  await prisma.adminLog.create({
    data: {
      actorId: viewer.id,
      level: "INFO",
      message: `Zmieniono rolę użytkownika ${target.email} (${target.id}) z ${target.role} na ${role}.`,
      context: JSON.stringify({
        action: "USER_ROLE_UPDATE",
        userId,
        from: target.role,
        to: role,
      }),
    },
  });

  return NextResponse.json({ ok: true, user: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } | Promise<{ userId: string }> }
) {
  const { userId: rawUserId } = await params;
  const userId = parseUserId(rawUserId);
  if (!userId) return jsonError("INVALID_USER", 400);

  let viewer;
  try {
    viewer = await requireAdminFromHeaders(req.headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return jsonError(error.code, error.status);
    }
    throw error;
  }

  if (viewer.id === userId) {
    return jsonError("CANNOT_DELETE_SELF", 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!target) return jsonError("USER_NOT_FOUND", 404);

  if (target.role === Role.OWNER && viewer.role !== Role.OWNER) {
    return jsonError("FORBIDDEN", 403);
  }

  await prisma.user.delete({ where: { id: userId } });

  await prisma.adminLog.create({
    data: {
      actorId: viewer.id,
      level: "WARN",
      message: `Usunięto użytkownika ${target.email} (${target.id}).`,
      context: JSON.stringify({ action: "USER_DELETE", userId }),
    },
  });

  return NextResponse.json({ ok: true });
}
