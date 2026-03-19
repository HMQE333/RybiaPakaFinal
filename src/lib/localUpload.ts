import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function detectImageMime(buf: Buffer): string | null {
  if (buf.length < 4) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

const MAX_GALLERY_BYTES = 8 * 1024 * 1024;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_BANNER_BYTES = 5 * 1024 * 1024;

export async function saveGalleryImage(file: File): Promise<string> {
  const ext = ALLOWED_MIME[file.type];
  if (!ext) throw new Error("UNSUPPORTED_FILE_TYPE");
  if (file.size > MAX_GALLERY_BYTES) throw new Error("FILE_TOO_LARGE");

  const dir = path.join(UPLOADS_ROOT, "galeria");
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const filepath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  return `/uploads/galeria/${filename}`;
}

export async function saveAvatarImage(file: File): Promise<string> {
  const ext = ALLOWED_MIME[file.type];
  if (!ext) throw new Error("UNSUPPORTED_FILE_TYPE");
  if (file.size > MAX_AVATAR_BYTES) throw new Error("FILE_TOO_LARGE");

  const dir = path.join(UPLOADS_ROOT, "avatars");
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectImageMime(buffer);
  if (!detectedMime || !ALLOWED_MIME[detectedMime]) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }
  const safeExt = ALLOWED_MIME[detectedMime];

  const filename = `${randomUUID()}.${safeExt}`;
  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/avatars/${filename}`;
}

export async function saveBannerImage(file: File): Promise<string> {
  const ext = ALLOWED_MIME[file.type];
  if (!ext) throw new Error("UNSUPPORTED_FILE_TYPE");
  if (file.size > MAX_BANNER_BYTES) throw new Error("FILE_TOO_LARGE");

  const dir = path.join(UPLOADS_ROOT, "banners");
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const filepath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  return `/uploads/banners/${filename}`;
}
