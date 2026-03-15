"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Link as LinkIcon, Plus, UploadCloud, X } from "lucide-react";

import type { CreateGalleryPayload } from "./galleryTypes";
import { handleUploadImageError } from "@/lib/imageFallback";

type CreateGalleryModalProps = {
  isOpen: boolean;
  isAuthenticated: boolean;
  authReady: boolean;
  categories: string[];
  onClose: () => void;
  onSubmit: (payload: CreateGalleryPayload) => Promise<boolean>;
};

export default function CreateGalleryModal({
  isOpen,
  isAuthenticated,
  authReady,
  categories,
  onClose,
  onSubmit,
}: CreateGalleryModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const compressionTokenRef = useRef(0);

  const isGifFile = (file: File) =>
    file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
  const isGifUrl = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return false;
    const noHash = trimmed.split("#")[0];
    const noQuery = noHash.split("?")[0];
    return noQuery.endsWith(".gif");
  };

  const compressImageFile = async (file: File) => {
    const maxBytes = 5 * 1024 * 1024;
    const maxEdge = 2400;
    const qualitySteps = [0.88, 0.8, 0.72, 0.64, 0.56, 0.48];

    const objectUrl = URL.createObjectURL(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
      img.src = objectUrl;
    }).finally(() => {
      URL.revokeObjectURL(objectUrl);
    });

    let scale = Math.min(
      1,
      maxEdge / Math.max(image.naturalWidth || 1, image.naturalHeight || 1)
    );

    const canvas = document.createElement("canvas");
    while (scale >= 0.25) {
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("NO_CONTEXT");
      ctx.drawImage(image, 0, 0, width, height);

      for (const quality of qualitySteps) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", quality)
        );
        if (!blob) continue;
        if (blob.size <= maxBytes) {
          const nextName = file.name.replace(/\.[^/.]+$/, ".jpg");
          return new File([blob], nextName, { type: "image/jpeg" });
        }
      }

      scale *= 0.85;
    }

    throw new Error("FILE_TOO_LARGE");
  };

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setDescription("");
    setCategory(categories[0] ?? "");
    setImageFile(null);
    setImageUrl("");
    setPreviewUrl(null);
    setError(null);
    setSubmitting(false);
    setIsCompressing(false);
  }, [categories, isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (isGifFile(file)) {
      setError("GIF-y są wyłączone.");
      setImageFile(null);
      setImageUrl("");
      setPreviewUrl(null);
      event.target.value = "";
      return;
    }

    const token = compressionTokenRef.current + 1;
    compressionTokenRef.current = token;
    setIsCompressing(true);
    setError(null);
    try {
      const compressed = await compressImageFile(file);
      if (compressionTokenRef.current !== token) return;
      setImageFile(compressed);
      setImageUrl("");
      const url = URL.createObjectURL(compressed);
      setPreviewUrl(url);
    } catch (error) {
      if (compressionTokenRef.current !== token) return;
      const message =
        (error as Error)?.message === "FILE_TOO_LARGE"
          ? "Nie udało się skompresować pliku do limitu 5 MB."
          : "Nie udało się przetworzyć pliku.";
      setError(message);
      setImageFile(null);
      setImageUrl("");
      setPreviewUrl(null);
      event.target.value = "";
    } finally {
      if (compressionTokenRef.current === token) {
        setIsCompressing(false);
      }
    }
  };

  const handleUrlChange = (value: string) => {
    compressionTokenRef.current += 1;
    setIsCompressing(false);
    setImageUrl(value);
    setImageFile(null);
    if (value.trim() && isGifUrl(value)) {
      setError("GIF-y są wyłączone.");
      setPreviewUrl(null);
      return;
    }
    setError(null);
    setPreviewUrl(value.trim() || null);
  };

  const handleSubmit = async () => {
    if (!authReady) {
      return;
    }
    if (isCompressing) {
      setError("Poczekaj, plik jest przetwarzany.");
      return;
    }
    if (!isAuthenticated) {
      setError("Zaloguj się, aby dodać zdjęcie.");
      return;
    }
    if (!title.trim() || !category) {
      setError("Uzupełnij tytuł i kategorię.");
      return;
    }
    if (!imageFile && !imageUrl.trim()) {
      setError("Dodaj zdjęcie lub podaj link.");
      return;
    }

    if (imageFile && isGifFile(imageFile)) {
      setError("GIF-y są wyłączone.");
      return;
    }
    if (imageUrl.trim() && isGifUrl(imageUrl)) {
      setError("GIF-y są wyłączone.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const ok = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      imageFile,
      imageUrl: imageUrl.trim(),
    });
    setSubmitting(false);
    if (ok) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-[92%] max-w-2xl rounded-3xl border border-white/10 bg-background-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-2">
              Galeria
            </p>
            <h2 className="text-xl font-semibold text-foreground">
              Dodaj nowe zdjęcie
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-background-4/80 p-2 text-foreground transition hover:border-accent hover:text-accent"
            aria-label="Zamknij"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
                Tytuł
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Np. Szczupak 85 cm na gumę"
                className="w-full rounded-xl border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
                Kategoria
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/60"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
              Opis
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Krótki opis, przynęta, warunki, miejscówka..."
              className="w-full rounded-xl border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/60 resize-none"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
                Wgraj plik
              </label>
              <button
                onClick={handlePickFile}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-background-4/70 px-4 py-3 text-sm text-foreground-2 transition hover:border-accent/40 hover:text-foreground"
              >
                <span>Wybierz zdjęcie z dysku</span>
                <UploadCloud size={18} className="text-accent" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              {imageFile && (
                <p className="text-xs text-foreground-2">
                  Wybrano: {imageFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-foreground-2">
                Link do zdjęcia
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-background px-3 py-2 text-sm text-foreground-2 focus-within:border-accent/60">
                <LinkIcon size={16} className="text-accent" />
                <input
                  value={imageUrl}
                  onChange={(event) => handleUrlChange(event.target.value)}
                  placeholder="https://..."
                  className="w-full bg-transparent text-foreground outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-white/10 bg-background-2/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-2">
              Podgląd
            </p>
            {previewUrl ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Podgląd"
                  loading="lazy"
                  decoding="async"
                  className="h-48 w-full object-cover"
                  onError={(event) =>
                    handleUploadImageError(
                      event.currentTarget,
                      "/artwork/404_post.png"
                    )
                  }
                />
              </div>
            ) : (
              <div className="mt-3 flex h-40 items-center justify-center rounded-xl border border-white/10 text-sm text-foreground-3">
                Brak podglądu
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          {authReady && !isAuthenticated && (
            <Link
              href="/logowanie"
              className="text-sm text-foreground-2 underline decoration-white/20 underline-offset-4 transition hover:text-accent hover:decoration-accent/60"
            >
              Zaloguj się, aby dodać zdjęcie.
            </Link>
          )}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-foreground-2 transition hover:border-accent/40 hover:text-accent"
            >
              Anuluj
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || isCompressing || !authReady || !isAuthenticated}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} />
              {submitting ? "Dodawanie..." : "Opublikuj"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
