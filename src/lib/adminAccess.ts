import { getSessionSafe } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@/lib/prismaEnums";

export type AdminViewer = {
  id: number;
  email: string;
  username: string | null;
  nick: string | null;
  role: string;
};

export class AdminAuthError extends Error {
  readonly status: number;
  readonly code: "UNAUTHORIZED" | "FORBIDDEN";

  constructor(code: "UNAUTHORIZED" | "FORBIDDEN", status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export function isAdminRole(role: string | null | undefined) {
  return role === Role.ADMIN || role === Role.OWNER;
}

export async function getViewerFromHeaders(
  headers: Headers
): Promise<AdminViewer | null> {
  const session = await getSessionSafe(headers);
  const viewerId = Number(session?.user?.id ?? "");
  if (!Number.isInteger(viewerId) || viewerId <= 0) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: viewerId },
    select: {
      id: true,
      email: true,
      username: true,
      nick: true,
      role: true,
    },
  });
}

export async function requireAdminFromHeaders(
  headers: Headers
): Promise<AdminViewer> {
  const viewer = await getViewerFromHeaders(headers);
  if (!viewer) {
    throw new AdminAuthError("UNAUTHORIZED", 401);
  }
  if (!isAdminRole(viewer.role)) {
    throw new AdminAuthError("FORBIDDEN", 403);
  }
  return viewer;
}

