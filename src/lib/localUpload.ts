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

const MAX_GALLERY_BYTES = 8 * 1024 * 1024;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

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

  const filename = `${randomUUID()}.${ext}`;
  const filepath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  return `/uploads/avatars/${filename}`;
}
