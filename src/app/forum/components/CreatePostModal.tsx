"use client";

import React, { useMemo, useRef, useState } from "react";
import { X, Image as ImageIcon, Send, Plus, Minus } from "lucide-react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: {
    title: string;
    content: string;
    tag: string;
  }) => Promise<boolean>;
  categories: string[];
}

const TITLE_MAX_LENGTH = 140;
const CONTENT_MAX_LENGTH = 5000;
const TAGS_MAX_LENGTH = 160;

const POST_TYPES = [
  "Pytanie",
  "Relacja z łowiska",
  "Poradnik",
  "Test sprzętu",
  "Ogłoszenie",
  "Plan wyprawy",
  "Dyskusja ogólna",
];

const METHODS = [
  "Spinning",
  "Grunt / Feeder",
  "Spławik",
  "Muchowe",
  "Trolling",
  "Podlodowe",
  "Inne",
];

const TARGETS = [
  "Szczupak",
  "Sandacz",
  "Okoń",
  "Karp",
  "Sum",
  "Pstrąg",
  "Boleń",
  "Leszcz",
  "Płoć",
  "Inne",
];

const WATER_TYPES = [
  "Jezioro",
  "Rzeka",
  "Kanał",
  "Staw",
  "Zbiornik zaporowy",
  "Morze",
  "Inne",
];

const TAG_SUGGESTIONS = [
  "porada",
  "relacja",
  "test-sprzętu",
  "zawody",
  "jesień",
  "nocne-brania",
  "nowy-zakup",
  "spotkanie",
];

function parseTags(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 8);
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
}: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<string>(categories[0] ?? "Ogólne");
  const [postType, setPostType] = useState("");
  const [method, setMethod] = useState("");
  const [target, setTarget] = useState("");
  const [waterType, setWaterType] = useState("");
  const [location, setLocation] = useState("");
  const [bait, setBait] = useState("");
  const [conditions, setConditions] = useState("");
  const [tags, setTags] = useState("");
  const [mediaLink, setMediaLink] = useState("");
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tagsList = useMemo(() => parseTags(tags), [tags]);
  const tagLabel = tagsList.map((tagItem) => `#${tagItem}`).join(" ");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    let success = false;

    const metaLines: string[] = [];
    if (postType) metaLines.push(`Typ wątku: ${postType}`);
    if (method) metaLines.push(`Metoda: ${method}`);
    if (target) metaLines.push(`Cel: ${target}`);
    if (waterType) metaLines.push(`Typ wody: ${waterType}`);
    if (location.trim()) metaLines.push(`Łowisko: ${location.trim()}`);
    if (bait.trim()) metaLines.push(`Przynęta: ${bait.trim()}`);
    if (conditions.trim()) metaLines.push(`Warunki: ${conditions.trim()}`);
    if (tagLabel) metaLines.push(`Tagi: ${tagLabel}`);
    if (mediaLink.trim()) metaLines.push(`Link: ${mediaLink.trim()}`);

    const pollLines = pollEnabled
      ? pollOptions.map((option) => option.trim()).filter(Boolean)
      : [];

    const sections: string[] = [];
    if (metaLines.length > 0) {
      sections.push(
        `Metryka wątku:\n${metaLines.map((line) => `- ${line}`).join("\n")}`
      );
    }
    if (pollLines.length >= 2) {
      sections.push(
        `Ankieta:\n${pollLines.map((line) => `- ${line}`).join("\n")}`
      );
    }

    const trimmedContent = content.trim();
    const composedContent =
      sections.length > 0
        ? `${sections.join("\n\n")}\n\n${trimmedContent}`
        : trimmedContent;

    try {
      success = await onSubmit({
        title: title.trim(),
        content: composedContent,
        tag,
      });
    } finally {
      setIsSubmitting(false);
    }

    if (!success) return;

    setTitle("");
    setContent("");
    setTag(categories[0] ?? "Ogólne");
    setPostType("");
    setMethod("");
    setTarget("");
    setWaterType("");
    setLocation("");
    setBait("");
    setConditions("");
    setTags("");
    setMediaLink("");
    setPollEnabled(false);
    setPollOptions(["", ""]);
    setAttachmentName(null);
    onClose();
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  const handleAddTag = (tagName: string) => {
    const normalized = tagName.trim().replace(/^#/, "");
    if (!normalized) return;
    if (tagsList.includes(normalized)) return;
    const next = [...tagsList, normalized].join(", ");
    setTags(next);
  };

  const handlePollOptionChange = (index: number, value: string) => {
    setPollOptions((prev) =>
      prev.map((option, idx) => (idx === index ? value : option))
    );
  };

  const handleAddPollOption = () => {
    setPollOptions((prev) => (prev.length < 4 ? [...prev, ""] : prev));
  };

  const handleRemovePollOption = (index: number) => {
    setPollOptions((prev) =>
      prev.length > 2 ? prev.filter((_, idx) => idx !== index) : prev
    );
  };

  const titleCount = `${title.trim().length}/${TITLE_MAX_LENGTH}`;
  const contentCount = `${content.trim().length}/${CONTENT_MAX_LENGTH}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="bg-background-2 border border-white/10 rounded-xl w-full max-w-5xl shadow-2xl modal-pop max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Utwórz nową dyskusję
            </h2>
            <p className="text-sm text-foreground-2">
              Dodaj kontekst i metrykę - poprawia to trafność odpowiedzi.
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

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <div>
            <input
              type="text"
              placeholder="Tytuł dyskusji"
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/50 transition-colors text-lg font-medium interactive-press disabled:opacity-70"
              autoFocus
            />
            <div className="mt-2 flex items-center justify-between text-xs text-foreground-2">
              <span>Najlepiej działa konkretny temat i jasny problem.</span>
              <span>{titleCount}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-foreground-2 mb-1 block">
                Kategoria
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-accent/50 transition-colors interactive-press disabled:opacity-70"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground-2 mb-1 block">
                Typ wątku
              </label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-accent/50 transition-colors interactive-press disabled:opacity-70"
              >
                <option value="">Wybierz typ</option>
                {POST_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-foreground-2 mb-1 block">
                Metoda
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-accent/50 transition-colors interactive-press disabled:opacity-70"
              >
                <option value="">Wybierz metodę</option>
                {METHODS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground-2 mb-1 block">
                Cel / gatunek
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-accent/50 transition-colors interactive-press disabled:opacity-70"
              >
                <option value="">Wybierz rybę</option>
                {TARGETS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground-2 mb-1 block">
                Typ łowiska
              </label>
              <select
                value={waterType}
                onChange={(e) => setWaterType(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-accent/50 transition-colors interactive-press disabled:opacity-70"
              >
                <option value="">Wybierz akwen</option>
                {WATER_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-foreground-2 mb-1 block">
                Łowisko / miejscówka
              </label>
              <input
                type="text"
                placeholder="np. Jezioro Zegrzyńskie, głęboka zatoka"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/50 transition-colors interactive-press disabled:opacity-70"
              />
            </div>
            <div>
              <label className="text-sm text-foreground-2 mb-1 block">
                Przynęta / zanęta
              </label>
              <input
                type="text"
                placeholder="np. guma 8 cm, kolor perła"
                value={bait}
                onChange={(e) => setBait(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/50 transition-colors interactive-press disabled:opacity-70"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-foreground-2 mb-1 block">
                Warunki
              </label>
              <input
                type="text"
                placeholder="np. 8°C, wiatr z północy, lekka mżawka"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/50 transition-colors interactive-press disabled:opacity-70"
              />
            </div>
            <div>
              <label className="text-sm text-foreground-2 mb-1 block">
                Link do zdjęcia/filmu
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/50 transition-colors interactive-press disabled:opacity-70"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-foreground-2 mb-1 block">Tagi</label>
            <input
              type="text"
              placeholder="np. szczupak, jesień, okonie"
              value={tags}
              maxLength={TAGS_MAX_LENGTH}
              onChange={(e) => setTags(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/50 transition-colors interactive-press disabled:opacity-70"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {TAG_SUGGESTIONS.map((tagItem) => (
                <button
                  key={tagItem}
                  type="button"
                  onClick={() => handleAddTag(tagItem)}
                  disabled={isSubmitting}
                  className="px-3 py-1 rounded-full text-xs border border-white/10 bg-background-4 text-foreground-2 hover:text-foreground hover:border-accent/40 transition-colors interactive-press disabled:opacity-60"
                >
                  #{tagItem}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-background-3/70 p-4 space-y-3">
            <label className="flex items-center gap-3 text-sm text-foreground-2">
              <input
                type="checkbox"
                checked={pollEnabled}
                onChange={(e) => setPollEnabled(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-white/20 bg-background-2 text-accent"
              />
              Dodaj ankietę (wersja alfa)
            </label>
            {pollEnabled && (
              <div className="space-y-3">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Opcja ${index + 1}`}
                      value={option}
                      onChange={(e) =>
                        handlePollOptionChange(index, e.target.value)
                      }
                      disabled={isSubmitting}
                      className="flex-1 bg-background-4 border border-white/10 rounded-lg px-4 py-2.5 text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/50 transition-colors interactive-press disabled:opacity-70"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(index)}
                        disabled={isSubmitting}
                        className="p-2 rounded-lg border border-white/10 text-foreground-2 hover:text-foreground hover:border-accent/40 transition-colors interactive-press disabled:opacity-60"
                        aria-label="Usuń opcję"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 text-sm text-foreground-2 hover:text-foreground transition-colors interactive-press disabled:opacity-60"
                  >
                    <Plus size={16} />
                    Dodaj opcję
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <textarea
              placeholder="Opisz sytuację: co działa, czego próbowałeś, o co pytasz."
              value={content}
              maxLength={CONTENT_MAX_LENGTH}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-background-3 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/50 transition-colors min-h-[220px] resize-none interactive-press disabled:opacity-70"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-foreground-2">
              <span>Metryka i ankieta zostaną dopięte nad treścią.</span>
              <span>{contentCount}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handlePickImage}
                disabled={isSubmitting}
                className="flex items-center gap-2 text-foreground-2 hover:text-foreground px-3 py-2 rounded-lg hover:bg-white/5 transition-colors interactive-press disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ImageIcon size={20} />
                <span className="text-sm">Dodaj zdjęcie</span>
              </button>
              {attachmentName && (
                <span className="text-xs text-foreground-2 italic shimmer-accent">
                  Dołączono: {attachmentName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
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
                className="flex items-center gap-2 bg-accent hover:bg-accent-2 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-accent/20 interactive-press"
              >
                <Send size={18} />
                <span>{isSubmitting ? "Publikuję..." : "Opublikuj"}</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-background-3/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Podgląd wątku
              </h3>
              <span className="text-xs text-foreground-2">{tag}</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {title.trim() || "Tytuł wątku"}
            </p>
            {postType && (
              <p className="text-xs text-foreground-2">Typ: {postType}</p>
            )}
            {(method ||
              target ||
              waterType ||
              location ||
              bait ||
              conditions ||
              tagLabel ||
              mediaLink) && (
              <div className="text-xs text-foreground-2 space-y-1">
                {method && <p>Metoda: {method}</p>}
                {target && <p>Cel: {target}</p>}
                {waterType && <p>Typ wody: {waterType}</p>}
                {location.trim() && <p>Łowisko: {location.trim()}</p>}
                {bait.trim() && <p>Przynęta: {bait.trim()}</p>}
                {conditions.trim() && <p>Warunki: {conditions.trim()}</p>}
                {tagLabel && <p>Tagi: {tagLabel}</p>}
                {mediaLink.trim() && <p>Link: {mediaLink.trim()}</p>}
              </div>
            )}
            {pollEnabled && (
              <div className="text-xs text-foreground-2">
                <p>Ankieta: {pollOptions.filter((opt) => opt.trim()).length} opcji</p>
              </div>
            )}
            <p className="text-sm text-foreground-2 line-clamp-3">
              {content.trim() || "Treść wątku pojawi się tutaj."}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}