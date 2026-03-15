"use client";

import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";

import type { EditGalleryPayload, GalleryItemWithMeta } from "./galleryTypes";
import { handleUploadImageError } from "@/lib/imageFallback";

type EditGalleryModalProps = {
  isOpen: boolean;
  item: GalleryItemWithMeta | null;
  categories: string[];
  onClose: () => void;
  onSubmit: (payload: EditGalleryPayload) => Promise<boolean>;
};

export default function EditGalleryModal({
  isOpen,
  item,
  categories,
  onClose,
  onSubmit,
}: EditGalleryModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setTitle(item.title ?? "");
    setDescription(item.description ?? "");
    setCategory(item.category ?? categories[0] ?? "");
    setImageUrl("");
    setError(null);
    setSubmitting(false);
  }, [categories, isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async () => {
    const safeTitle = title.trim();
    if (!safeTitle) {
      setError("Uzupełnij tytuł zdjęcia.");
      return;
    }
    if (!category) {
      setError("Wybierz kategorię.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const ok = await onSubmit({
      id: item.id,
      title: safeTitle,
      description: description.trim(),
      category,
      imageUrl: imageUrl.trim() || undefined,
    });
    setSubmitting(false);
    if (ok) {
      onClose();
    }
  };

  const previewUrl =
    typeof item.imageUrl === "string" ? item.imageUrl : item.imageUrl.src;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-[92%] max-w-2xl rounded-3xl border border-white/10 bg-background-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-2">
              Galeria
            </p>
            <h2 className="text-xl font-semibold text-foreground">
              Edytuj zdjęcie
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-white/10 bg-background-4/80 p-2 text-foreground transition hover:border-accent hover:text-accent disabled:opacity-60"
            aria-label="Zamknij"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-background-2/60 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="h-40 w-full rounded-xl object-cover"
              onError={(event) =>
                handleUploadImageError(
                  event.currentTarget,
                  "/artwork/404_post.png"
                )
              }
            />
          </div>

          <div>
            <label className="text-sm text-foreground-2 mb-1 block">
              Tytuł
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={submitting}
              className="w-full rounded-xl border border-white/10 bg-background-2/80 px-4 py-2.5 text-foreground outline-none focus:border-accent/60"
            />
          </div>

          <div>
            <label className="text-sm text-foreground-2 mb-1 block">Opis</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={submitting}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-background-2/80 px-4 py-2.5 text-foreground outline-none focus:border-accent/60 resize-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-foreground-2 mb-1 block">
                Kategoria
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                disabled={submitting}
                className="w-full rounded-xl border border-white/10 bg-background-2/80 px-4 py-2.5 text-foreground outline-none focus:border-accent/60"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground-2 mb-1 block">
                Nowy link do zdjęcia (opcjonalnie)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                disabled={submitting}
                placeholder="Pozostaw puste bez zmian"
                className="w-full rounded-xl border border-white/10 bg-background-2/80 px-4 py-2.5 text-foreground outline-none focus:border-accent/60"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-foreground-2 hover:text-foreground transition-colors disabled:opacity-60"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-background-2/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent disabled:opacity-60"
            >
              <Pencil size={16} />
              Zapisz zmiany
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
