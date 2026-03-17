import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { saveAvatarImage, saveBannerImage } from "@/lib/localUpload";

const NICK_REGEX = /^[a-zA-Z0-9_\-]{3,20}$/;

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

  let nick = "";
  let name = "";
  let pronouns = "";
  let bio = "";
  let age = "";
  let regionId = "";
  let methods: string[] = [];
  let avatarFile: File | null = null;
  let bannerFile: File | null = null;
  let avatarUrl: string | null = null;
  let bannerUrl: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    nick = String(form.get("nick") ?? "").trim();
    name = String(form.get("name") ?? "").trim();
    pronouns = String(form.get("pronouns") ?? "").trim();
    bio = String(form.get("bio") ?? "").trim();
    age = String(form.get("age") ?? "").trim();
    regionId = String(form.get("regionId") ?? "").trim();
    const methodsRaw = form.get("methods");
    if (typeof methodsRaw === "string" && methodsRaw) {
      try {
        methods = JSON.parse(methodsRaw);
      } catch {
        methods = [];
      }
    }
    const av = form.get("avatarFile");
    if (av instanceof File && av.size > 0) avatarFile = av;
    const bn = form.get("bannerFile");
    if (bn instanceof File && bn.size > 0) bannerFile = bn;
    const avUrl = form.get("avatarUrl");
    if (typeof avUrl === "string" && avUrl) avatarUrl = avUrl;
    const bnUrl = form.get("bannerUrl");
    if (typeof bnUrl === "string" && bnUrl) bannerUrl = bnUrl;
  } else {
    const body = await req.json().catch(() => ({}));
    nick = String(body.nick ?? "").trim();
    name = String(body.name ?? "").trim();
    pronouns = String(body.pronouns ?? "").trim();
    bio = String(body.bio ?? "").trim();
    age = String(body.age ?? "").trim();
    regionId = String(body.regionId ?? "").trim();
    methods = Array.isArray(body.methods) ? body.methods : [];
    avatarUrl = body.avatarUrl ?? null;
    bannerUrl = body.bannerUrl ?? null;
  }

  if (!nick) {
    return NextResponse.json({ error: "NICK_REQUIRED" }, { status: 400 });
  }

  if (!NICK_REGEX.test(nick)) {
    return NextResponse.json({ error: "NICK_INVALID" }, { status: 400 });
  }

  const existing = await prisma.$queryRaw<{ id: number }[]>`
    SELECT "id" FROM "User"
    WHERE (lower("nick") = ${nick.toLowerCase()} OR lower("username") = ${nick.toLowerCase()})
      AND "id" != ${userId}
    LIMIT 1
  `;

  if (existing.length > 0) {
    return NextResponse.json({ error: "NICK_TAKEN" }, { status: 409 });
  }

  if (avatarFile) {
    try {
      avatarUrl = await saveAvatarImage(avatarFile);
    } catch {
      avatarUrl = null;
    }
  }

  if (bannerFile) {
    try {
      bannerUrl = await saveBannerImage(bannerFile);
    } catch {
      bannerUrl = null;
    }
  }

  const ageNum = age ? parseInt(age, 10) : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      nick,
      name: name || nick,
      pronouns: pronouns || null,
      bio: bio || null,
      age: ageNum && !isNaN(ageNum) ? ageNum : null,
      regionId: regionId || null,
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(bannerUrl !== undefined ? { bannerUrl: bannerUrl || null } : {}),
      onboardingCompletedAt: new Date(),
    },
  });

  if (methods.length > 0) {
    await prisma.userFishingMethod.deleteMany({ where: { userId } });
    await prisma.userFishingMethod.createMany({
      data: methods.map((methodId: string) => ({ userId, methodId })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ success: true });
}
