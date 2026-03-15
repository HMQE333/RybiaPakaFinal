"use client";

import React, { useEffect, useState } from "react";
import { X, Save } from "lucide-react";

type EditPostModalProps = {
  isOpen: boolean;
  post: { id: number; title: string; content: string } | null;
  onClose: () => void;
  onSubmit: (payload: {
    id: number;
    title: string;
    content: string;
  }) => Promise<boolean>;
};

const TITLE_MAX_LENGTH = 140;
const CONTENT_MAX_LENGTH = 5000;

export default function EditPostModal({
  isOpen,
  post,
  onClose,
  onSubmit,
}: EditPostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !post) return;
    setTitle(post.title);
    setContent(post.content);
    setIsSubmitting(false);
  }, [isOpen, post]);

  if (!isOpen || !post) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const success = await onSubmit({
      id: post.id,
      title: title.trim(),
      content: content.trim(),
    });
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const titleCount = `${title.trim().length}/${TITLE_MAX_LENGTH}`;
  const contentCount = `${content.trim().length}/${CONTENT_MAX_LENGTH}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="bg-background-2 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl modal-pop"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Edytuj wątek
            </h2>
            <p className="text-xs text-foreground-2">
              Zachowaj sekcje metryki i ankiety, jeśli chcesz je utrzymać.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/10 rounded-full text-foreground-2 transition-colors interactive-press disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Zamknij"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Tytuł wątku"
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isSubmitting}
              className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/50 transition-colors text-lg font-medium interactive-press disabled:opacity-70"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-foreground-2">
              <span>Aktualizuj tytuł, aby lepiej opisać temat.</span>
              <span>{titleCount}</span>
            </div>
          </div>

          <div>
            <textarea
              placeholder="Treść wątku"
              value={content}
              maxLength={CONTENT_MAX_LENGTH}
              onChange={(event) => setContent(event.target.value)}
              disabled={isSubmitting}
              className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/50 transition-colors min-h-[220px] resize-none interactive-press disabled:opacity-70"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-foreground-2">
              <span>Treść zostanie zaktualizowana w dyskusji.</span>
              <span>{contentCount}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-foreground-2 hover:text-foreground font-medium transition-colors interactive-press disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-2 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 font-medium transition-colors shadow-lg shadow-accent/20 interactive-press"
            >
              <Save size={18} />
              <span>{isSubmitting ? "Zapisuję..." : "Zapisz zmiany"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
