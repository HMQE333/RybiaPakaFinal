import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { galleryUpload } from "@/lib/galleryClient";
import { resolveSessionUserId } from "@/app/api/galeria/_utils";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  const userId = await resolveSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let newAvatarUrl: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "MISSING_FILE" }, { status: 400 });
    }

    const extension = AVATAR_EXTENSIONS[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: "UNSUPPORTED_FILE_TYPE" },
        { status: 400 }
      );
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
    }

    const uploadForm = new FormData();
    uploadForm.set("file", file);
    uploadForm.set("kind", "avatar");
    uploadForm.set("authorId", String(userId));

    try {
      const uploadResult = await galleryUpload(uploadForm);
      newAvatarUrl = String(uploadResult.url || "").trim();
      if (!newAvatarUrl) {
        return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 502 });
      }
    } catch {
      return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 502 });
    }
  } else {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const rawUrl = String(body?.avatarUrl ?? "").trim();
    newAvatarUrl = rawUrl || null;
  }

  if (newAvatarUrl === currentUser.avatarUrl) {
    return NextResponse.json({
      avatarUrl: currentUser.avatarUrl,
      unchanged: true,
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: newAvatarUrl },
  });

  return NextResponse.json({ avatarUrl: newAvatarUrl });
}
