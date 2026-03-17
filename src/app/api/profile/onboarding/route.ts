import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { saveAvatarImage, saveBannerImage } from "@/lib/localUpload";

const NICK_REGEX = /^[a-zA-Z0-9_\-]{3,20}$/;

const PRESET_BANNER_GRADIENTS: Record<string, string> = {
  "gleboka-woda": "linear-gradient(135deg, #001a3a 0%, #003a7a 50%, #0055aa 100%)",
  "zielony-las": "linear-gradient(135deg, #002200 0%, #004d00 50%, #007a00 100%)",
  "zachod-slonca": "linear-gradient(135deg, #4a0800 0%, #aa2200 40%, #ff6600 100%)",
  "mgla-poranna": "linear-gradient(135deg, #0d0d1a 0%, #1a2040 50%, #2d3a6e 100%)",
  "torfowisko": "linear-gradient(135deg, #1a0d00 0%, #3d2a00 50%, #5c4020 100%)",
  "rzeka": "linear-gradient(135deg, #001a1a 0%, #004d50 50%, #007a7d 100%)",
};

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
  let pronouns = "";
  let bio = "";
  let ageRange = "";
  let methods: string[] = [];
  let avatarFile: File | null = null;
  let bannerFile: File | null = null;
  let avatarUrl: string | null = null;
  let bannerUrl: string | null = null;
  let bannerPresetId = "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    nick = String(form.get("nick") ?? "").trim();
    pronouns = String(form.get("pronouns") ?? "").trim();
    bio = String(form.get("bio") ?? "").trim();
    ageRange = String(form.get("ageRange") ?? "").trim();
    bannerPresetId = String(form.get("bannerPresetId") ?? "").trim();
    const methodsRaw = form.get("methods");
    if (typeof methodsRaw === "string" && methodsRaw) {
      try { methods = JSON.parse(methodsRaw); } catch { methods = []; }
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
    pronouns = String(body.pronouns ?? "").trim();
    bio = String(body.bio ?? "").trim();
    ageRange = String(body.ageRange ?? "").trim();
    bannerPresetId = String(body.bannerPresetId ?? "").trim();
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
    try { avatarUrl = await saveAvatarImage(avatarFile); } catch { avatarUrl = null; }
  }

  if (bannerFile) {
    try { bannerUrl = await saveBannerImage(bannerFile); } catch { bannerUrl = null; }
  } else if (bannerPresetId && PRESET_BANNER_GRADIENTS[bannerPresetId]) {
    bannerUrl = `preset:${bannerPresetId}`;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      nick,
      name: nick,
      pronouns: pronouns || null,
      bio: bio || null,
      ageRange: ageRange || null,
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
