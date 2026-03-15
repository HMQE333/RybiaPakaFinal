import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";

import { getUploadsRoot } from "@/lib/uploads";

const CACHE_CONTROL = "public, max-age=31536000, immutable";
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function resolveFilePath(segments: string[]) {
  const root = path.resolve(getUploadsRoot());
  const requested = path.resolve(root, ...segments);
  const rootWithSep = `${root}${path.sep}`;
  if (!requested.startsWith(rootWithSep)) {
    return null;
  }
  return requested;
}

async function serveFile(segments: string[], headOnly: boolean) {
  if (!segments.length || segments.some((segment) => segment.includes(".."))) {
    return new NextResponse("Invalid path", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const filePath = resolveFilePath(segments);
  if (!filePath) {
    return new NextResponse("Invalid path", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat || !stat.isFile()) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const contentType =
    CONTENT_TYPES[path.extname(filePath).toLowerCase()] ||
    "application/octet-stream";
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Content-Length", String(stat.size));
  headers.set("Cache-Control", CACHE_CONTROL);

  if (headOnly) {
    return new NextResponse(null, { status: 200, headers });
  }

  const data = await fs.readFile(filePath);
  return new NextResponse(data, { status: 200, headers });
}

type RouteContext = {
  params: { path: string[] } | Promise<{ path: string[] }>;
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const resolvedParams = await Promise.resolve(params);
  const segments = Array.isArray(resolvedParams.path)
    ? resolvedParams.path
    : [];
  return serveFile(segments, false);
}

export async function HEAD(_req: NextRequest, { params }: RouteContext) {
  const resolvedParams = await Promise.resolve(params);
  const segments = Array.isArray(resolvedParams.path)
    ? resolvedParams.path
    : [];
  return serveFile(segments, true);
}
