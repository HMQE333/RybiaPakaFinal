import prisma from "@/lib/prisma";
import { ReportCategory, ReportStatus, Role } from "@/lib/prismaEnums";

export type AdminStats = {
  users: number;
  posts: number;
  messages: number;
  activeReports: number;
};

export type AdminUserRow = {
  id: number;
  username: string;
  nick?: string | null;
  email: string;
  role: Role;
  bannedAt?: string | Date | null;
  banReason?: string | null;
  banByLabel?: string | null;
  suspensionUntil?: string | Date | null;
  suspensionReason?: string | null;
  suspensionByLabel?: string | null;
  suspensionAt?: string | Date | null;
};

export type AdminReportRow = {
  id: string;
  title: string;
  type: ReportCategory;
  status: ReportStatus;
  author: string;
  targetType?: string | null;
  targetId?: string | null;
};

export type ModerationRow = {
  id: string;
  title: string;
  excerpt: string;
  type: string;
  author: string;
  createdAt: string;
  targetType?: string | null;
  targetId?: string | null;
};

export type AdminLogRow = {
  id: string;
  time: string;
  message: string;
  level: string;
  actor: string;
};

export type ContentArchiveRow = {
  id: string;
  targetType: string;
  targetId: string;
  author: string;
  reporter: string;
  admin: string;
  createdAt: string;
  deletedAt: string;
  expiresAt: string;
  restoredAt: string | null;
};

export async function getAdminStats(): Promise<AdminStats> {
  const [users, posts, messages, reports] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.message.count(),
    prisma.report.count({ where: { status: ReportStatus.PENDING } }),
  ]);

  return {
    users,
    posts,
    messages,
    activeReports: reports,
  };
}

export async function listUsers(query?: string): Promise<AdminUserRow[]> {
  const where = query
    ? {
        OR: [
          { username: { contains: query } },
          { email: { contains: query } },
          { nick: { contains: query } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      nick: true,
      email: true,
      role: true,
      createdAt: true,
      bannedAt: true,
      banReason: true,
      banByLabel: true,
      suspensionUntil: true,
      suspensionReason: true,
      suspensionByLabel: true,
      suspensionAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username ?? u.nick ?? u.email,
    nick: u.nick ?? null,
    email: u.email,
    role: (Object.values(Role) as string[]).includes(u.role)
      ? (u.role as Role)
      : Role.NORMAL,
    bannedAt: u.bannedAt,
    banReason: u.banReason,
    banByLabel: u.banByLabel,
    suspensionUntil: u.suspensionUntil,
    suspensionReason: u.suspensionReason,
    suspensionByLabel: u.suspensionByLabel,
    suspensionAt: u.suspensionAt,
  }));
}

export async function listReports(query?: string): Promise<AdminReportRow[]> {
  const where = {
    status: { in: [ReportStatus.PENDING, ReportStatus.IN_REVIEW] },
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { reporter: { username: { contains: query } } },
            { reporter: { email: { contains: query } } },
          ],
        }
      : {}),
  };

  const reports = await prisma.report.findMany({
    where,
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      targetType: true,
      targetId: true,
      reporter: {
        select: { username: true, nick: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return reports.map((r) => ({
    id: r.id,
    title: r.title,
    type: (Object.values(ReportCategory) as string[]).includes(r.category)
      ? (r.category as ReportCategory)
      : ReportCategory.OTHER,
    status: (Object.values(ReportStatus) as string[]).includes(r.status)
      ? (r.status as ReportStatus)
      : ReportStatus.PENDING,
    author: r.reporter?.username ?? r.reporter?.nick ?? r.reporter?.email ?? "",
    targetType: r.targetType ?? null,
    targetId: r.targetId ?? null,
  }));
}

export async function listContentQueue(): Promise<ModerationRow[]> {
  const reports = await prisma.report.findMany({
    where: {
      category: ReportCategory.CONTENT,
      status: { in: [ReportStatus.PENDING, ReportStatus.IN_REVIEW] },
    },
    select: {
      id: true,
      title: true,
      description: true,
      targetType: true,
      targetId: true,
      createdAt: true,
      reporter: { select: { username: true, nick: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return reports.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.description ?? "",
    targetType: r.targetType ?? null,
    targetId: r.targetId ?? null,
    type: r.targetType ?? "Treść",
    author: r.reporter?.username ?? r.reporter?.nick ?? r.reporter?.email ?? "",
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function listLogs(query?: string): Promise<AdminLogRow[]> {
  const where = query
    ? {
        OR: [
          { message: { contains: query } },
          { actor: { username: { contains: query } } },
        ],
      }
    : {};

  const logs = await prisma.adminLog.findMany({
    where,
    select: {
      id: true,
      message: true,
      level: true,
      createdAt: true,
      actor: { select: { username: true, nick: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return logs.map((l) => ({
    id: l.id,
    time: l.createdAt.toISOString(),
    message: l.message,
    level: l.level,
    actor:
      l.actor?.username ??
      l.actor?.nick ??
      (l.actor?.email ? l.actor.email.split("@")[0] : "") ??
      "",
  }));
}

export async function listContentArchive(): Promise<ContentArchiveRow[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await prisma.contentArchive.findMany({
    where: { deletedAt: { gte: since } },
    orderBy: { deletedAt: "desc" },
    take: 200,
  });

  return rows.map((row) => ({
    id: row.id,
    targetType: row.targetType,
    targetId: row.targetId,
    author: row.authorLabel,
    reporter: row.reporterLabel,
    admin: row.adminLabel,
    createdAt: row.createdAt.toISOString(),
    deletedAt: row.deletedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    restoredAt: row.restoredAt ? row.restoredAt.toISOString() : null,
  }));
}

export async function getSiteSettings() {
  const items = await prisma.siteSetting.findMany();
  const map = Object.fromEntries(items.map((i) => [i.key, i.value]));

  return {
    siteName: map.siteName ?? "RybiaPaka.pl",
    maintenance: map.maintenanceMode === "true",
    headerBadge: map.headerBadge ?? "",
  };
}

export async function updateSiteSettings(data: {
  siteName?: string;
  maintenance?: boolean;
  headerBadge?: string;
  actorId?: number;
}) {
  const entries: Array<{ key: string; value: string }> = [];
  if (typeof data.siteName === "string") {
    entries.push({ key: "siteName", value: data.siteName });
  }
  if (typeof data.maintenance === "boolean") {
    entries.push({
      key: "maintenanceMode",
      value: data.maintenance ? "true" : "false",
    });
  }
  if (typeof data.headerBadge === "string") {
    entries.push({ key: "headerBadge", value: data.headerBadge });
  }

  if (entries.length > 0) {
    for (const entry of entries) {
      await prisma.siteSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: entry,
      });
    }

    await prisma.adminLog.create({
      data: {
        message: "Zmieniono ustawienia strony",
        level: "INFO",
        actorId: Number.isInteger(data.actorId) ? data.actorId : undefined,
        context: JSON.stringify({
          action: "SITE_SETTINGS_UPDATE",
          entries,
        }),
      },
    });
  }

  return getSiteSettings();
}
