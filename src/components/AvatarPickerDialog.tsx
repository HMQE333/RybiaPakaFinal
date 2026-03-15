"use client";

import { useEffect, useMemo, useRef } from "react";
import { Check, X } from "lucide-react";

import { cn } from "@/utils";

type DefaultAvatar = {
  id: string;
  src: string;
};

type AvatarPickerTab = "default" | "custom";

type AvatarPickerDialogProps = {
  open: boolean;
  activeTab: AvatarPickerTab;
  onTabChange: (tab: AvatarPickerTab) => void;
  onClose: () => void;
  defaultAvatars: DefaultAvatar[];
  selectedDefault: string;
  onSelectDefault: (src: string) => void;
  onSaveDefault: () => void;
  canSaveDefault: boolean;
  onSaveCustom: () => void;
  canSaveCustom: boolean;
  customContent: React.ReactNode;
};

const focusableSelector =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export default function AvatarPickerDialog({
  open,
  activeTab,
  onTabChange,
  onClose,
  defaultAvatars,
  selectedDefault,
  onSelectDefault,
  onSaveDefault,
  canSaveDefault,
  onSaveCustom,
  canSaveCustom,
  customContent,
}: AvatarPickerDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const bodyOverflowRef = useRef<string>("");

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    bodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirst = () => {
      const root = dialogRef.current;
      if (!root) return;
      const items = Array.from(
        root.querySelectorAll<HTMLElement>(focusableSelector)
      );
      if (items.length > 0) {
        items[0].focus();
      } else {
        root.focus();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const root = dialogRef.current;
      if (!root) return;
      const items = Array.from(
        root.querySelectorAll<HTMLElement>(focusableSelector)
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!active || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const raf = requestAnimationFrame(focusFirst);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = bodyOverflowRef.current;
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  const saveDisabled = useMemo(() => {
    return activeTab === "default" ? !canSaveDefault : !canSaveCustom;
  }, [activeTab, canSaveDefault, canSaveCustom]);

  const handleSave = () => {
    if (activeTab === "default") {
      onSaveDefault();
    } else {
      onSaveCustom();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/70 px-4 py-6 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-picker-title"
        tabIndex={-1}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-background-3/95 via-background-2/95 to-background-3/90 shadow-[0_25px_70px_rgba(0,0,0,0.6)] sm:rounded-3xl"
      >
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_10%,rgba(0,206,0,0.12),transparent_45%)]" />
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_85%_15%,rgba(0,150,255,0.12),transparent_50%)]" />
        <div className="relative border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 id="avatar-picker-title" className="text-lg font-semibold text-foreground">
              Wybierz avatar
            </h3>
            <p className="text-xs text-foreground-2">
              Domyslny lub wlasny obraz.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-white/10 bg-background-2/70 text-foreground-2 hover:text-foreground hover:border-white/20 transition-colors"
            aria-label="Zamknij"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative px-6 pt-4">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-background-2/60 p-1 text-xs text-foreground-2">
            <button
              type="button"
              onClick={() => onTabChange("default")}
              className={cn(
                "flex-1 rounded-full px-3 py-2 transition-colors",
                activeTab === "default"
                  ? "bg-background-3 text-foreground"
                  : "hover:text-foreground"
              )}
            >
              Domyslne
            </button>
            <button
              type="button"
              onClick={() => onTabChange("custom")}
              className={cn(
                "flex-1 rounded-full px-3 py-2 transition-colors",
                activeTab === "custom"
                  ? "bg-background-3 text-foreground"
                  : "hover:text-foreground"
              )}
            >
              Wlasny
            </button>
          </div>
        </div>

        <div className="relative p-6">
          {activeTab === "default" ? (
            <div className="space-y-4">
              <div className="text-xs text-foreground-2">
                Wybierz jeden z 10 domyslnych avatarow.
              </div>
              <div className="grid grid-cols-5 gap-3 sm:grid-cols-5">
                {defaultAvatars.map((avatar, index) => {
                  const isSelected = selectedDefault === avatar.src;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => onSelectDefault(avatar.src)}
                      aria-label={`Avatar ${index + 1}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-full border border-white/10 transition hover:border-accent/60",
                        isSelected && "ring-2 ring-accent/80"
                      )}
                    >
                      <img
                        src={avatar.src}
                        alt={`Avatar ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                      {isSelected && (
                        <span className="absolute inset-0 grid place-items-center bg-black/40 text-white">
                          <Check size={18} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            customContent
          )}
        </div>

        <div className="relative border-t border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-foreground-2">
            Zmiany zostana zapisane po kliknieciu Zapisz.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-background-2/80 px-4 py-2 text-sm text-foreground-2 hover:text-foreground hover:border-white/20 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-[0_0_18px_rgba(0,206,0,0.35)] transition-shadow"
            >
              Zapisz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
