import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { saveAvatarImage } from "@/lib/localUpload";
import { resolveSessionUserId } from "@/app/api/galeria/_utils";

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

    try {
      newAvatarUrl = await saveAvatarImage(file);
    } catch (uploadError) {
      const msg = (uploadError as Error)?.message ?? "";
      if (msg === "UNSUPPORTED_FILE_TYPE") {
        return NextResponse.json({ error: "UNSUPPORTED_FILE_TYPE" }, { status: 400 });
      }
      if (msg === "FILE_TOO_LARGE") {
        return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
      }
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
