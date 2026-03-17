import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { saveBannerImage } from "@/lib/localUpload";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const userId =
    typeof session.user.id === "string"
      ? parseInt(session.user.id, 10)
      : (session.user.id as unknown as number);

  const contentType = req.headers.get("content-type") ?? "";
  let newBannerUrl: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "MISSING_FILE" }, { status: 400 });
    }

    try {
      newBannerUrl = await saveBannerImage(file);
    } catch (err) {
      const msg = (err as Error)?.message ?? "";
      if (msg === "UNSUPPORTED_FILE_TYPE") {
        return NextResponse.json({ error: "UNSUPPORTED_FILE_TYPE" }, { status: 400 });
      }
      if (msg === "FILE_TOO_LARGE") {
        return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
      }
      return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 502 });
    }
  } else {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { bannerUrl: newBannerUrl },
  });

  return NextResponse.json({ bannerUrl: newBannerUrl });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const userId =
    typeof session.user.id === "string"
      ? parseInt(session.user.id, 10)
      : (session.user.id as unknown as number);

  await prisma.user.update({
    where: { id: userId },
    data: { bannerUrl: null },
  });

  return NextResponse.json({ bannerUrl: null });
}
