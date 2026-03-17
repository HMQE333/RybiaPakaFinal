"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DEFAULT_AVATARS } from "@/lib/avatarDefaults";
import { cn } from "@/utils";

type RegionOption = { id: string; name: string };
type MethodOption = { id: string; name: string };

type WizardUser = {
  nick: string | null;
  name: string;
  pronouns: string | null;
  bio: string | null;
  age: number | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  regionId: string | null;
  methods: string[];
};

type Props = {
  user: WizardUser;
  regions: RegionOption[];
  methods: MethodOption[];
};

type NickStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const NICK_REGEX = /^[a-zA-Z0-9_\-]{3,20}$/;
const STEPS = ["Nick", "Awatar", "Baner", "O Tobie"];

function FishIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
    </svg>
  );
}

function ProfilePreview({
  nick, name, pronouns, bio, age, avatarUrl, bannerUrl, regionName, methodNames,
}: {
  nick: string; name: string; pronouns: string; bio: string; age: string;
  avatarUrl: string; bannerUrl: string; regionName: string; methodNames: string[];
}) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-background-3 shadow-2xl">
      <div
        className="relative h-[120px] flex-shrink-0"
        style={{
          background: bannerUrl
            ? `url(${bannerUrl}) center/cover no-repeat`
            : "linear-gradient(135deg, #003a00 0%, #006600 40%, #00ce00 100%)",
        }}
      >
        {!bannerUrl && (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg viewBox="0 0 200 80" fill="none" className="w-full h-full">
              <path d="M0 40 Q50 10 100 40 Q150 70 200 40" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="30" cy="35" r="3" fill="white"/>
              <path d="M30 35 L30 60" stroke="white" strokeWidth="1"/>
            </svg>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="relative -mt-10 mb-3 flex items-end justify-between">
          <div className="relative">
            <div className="w-[76px] h-[76px] rounded-full border-4 border-background-3 overflow-hidden bg-background-4 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🎣</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-lg font-bold text-foreground leading-tight">
            {name || nick || "Twoja nazwa"}
          </p>
          {nick && (
            <p className="text-sm text-foreground-2">@{nick}</p>
          )}
          {pronouns && (
            <p className="text-xs text-foreground-2 italic">{pronouns}</p>
          )}
          {bio && (
            <p className="text-sm text-foreground-2 mt-2 leading-relaxed">{bio}</p>
          )}
        </div>

        {(regionName || methodNames.length > 0 || age) && (
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
            {regionName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background-4 px-3 py-1 text-xs text-foreground-2">
                🗺️ {regionName}
              </span>
            )}
            {age && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background-4 px-3 py-1 text-xs text-foreground-2">
                📅 {age} lat
              </span>
            )}
            {methodNames.slice(0, 3).map((m) => (
              <span key={m} className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/30 px-3 py-1 text-xs text-accent">
                🎣 {m}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingWizard({ user, regions, methods }: Props) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [nick, setNick] = useState(user.nick ?? "");
  const [name, setName] = useState(user.name ?? user.nick ?? "");
  const [pronouns, setPronouns] = useState(user.pronouns ?? "");
  const [nickStatus, setNickStatus] = useState<NickStatus>("idle");
  const nickCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckedNick = useRef<string>("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl ?? "");
  const [avatarDragActive, setAvatarDragActive] = useState(false);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState(user.bannerUrl ?? "");
  const [bannerDragActive, setBannerDragActive] = useState(false);

  const [bio, setBio] = useState(user.bio ?? "");
  const [age, setAge] = useState(user.age ? String(user.age) : "");
  const [regionId, setRegionId] = useState(user.regionId ?? "");
  const [selectedMethods, setSelectedMethods] = useState<string[]>(user.methods ?? []);

  const regionName = regions.find((r) => r.id === regionId)?.name ?? "";
  const methodNames = selectedMethods
    .map((id) => methods.find((m) => m.id === id)?.name ?? "")
    .filter(Boolean);

  const checkNick = useCallback(async (value: string) => {
    if (!value || !NICK_REGEX.test(value)) {
      setNickStatus(value ? "invalid" : "idle");
      return;
    }
    if (value === lastCheckedNick.current) return;
    setNickStatus("checking");
    try {
      const res = await fetch(`/api/profile/nick-check?nick=${encodeURIComponent(value)}`);
      const data = await res.json();
      lastCheckedNick.current = value;
      setNickStatus(data.available ? "available" : "taken");
    } catch {
      setNickStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (nickCheckTimer.current) clearTimeout(nickCheckTimer.current);
    if (!nick) { setNickStatus("idle"); return; }
    if (!NICK_REGEX.test(nick)) { setNickStatus("invalid"); return; }
    setNickStatus("checking");
    nickCheckTimer.current = setTimeout(() => checkNick(nick), 600);
    return () => { if (nickCheckTimer.current) clearTimeout(nickCheckTimer.current); };
  }, [nick, checkNick]);

  const handleImageFile = (file: File, type: "avatar" | "banner") => {
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) return;
    const url = URL.createObjectURL(file);
    if (type === "avatar") { setAvatarFile(file); setAvatarPreview(url); }
    else { setBannerFile(file); setBannerPreview(url); }
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setAvatarDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file, "avatar");
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setBannerDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file, "banner");
  };

  const toggleMethod = (id: string) => {
    setSelectedMethods((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canProceedStep1 = nick.length >= 3 && (nickStatus === "available" || (nick === user.nick && nickStatus !== "taken"));
  const canProceedStep2 = true;
  const canProceedStep3 = true;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const form = new FormData();
      form.append("nick", nick);
      form.append("name", name || nick);
      form.append("pronouns", pronouns);
      form.append("bio", bio);
      form.append("age", age);
      form.append("regionId", regionId);
      form.append("methods", JSON.stringify(selectedMethods));
      if (avatarFile) form.append("avatarFile", avatarFile);
      else if (avatarPreview) form.append("avatarUrl", avatarPreview);
      if (bannerFile) form.append("bannerFile", bannerFile);
      else if (bannerPreview) form.append("bannerUrl", bannerPreview);

      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "NICK_TAKEN") { setSubmitError("Ten nick jest już zajęty. Wróć i zmień go."); return; }
        if (data.error === "NICK_REQUIRED" || data.error === "NICK_INVALID") { setSubmitError("Wpisz poprawny nick (3–20 znaków, litery/cyfry/_ /-)."); return; }
        setSubmitError("Błąd zapisu. Spróbuj ponownie.");
        return;
      }

      router.push("/?welcome=1");
    } catch {
      setSubmitError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-lg tracking-tight">🎣 rybiapaka.pl</span>
        </div>
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                step === i + 1
                  ? "bg-accent text-black"
                  : step > i + 1
                  ? "bg-accent/20 text-accent"
                  : "text-foreground-2"
              )}>
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                  step === i + 1 ? "bg-black/20" : step > i + 1 ? "bg-accent text-black" : "bg-white/10"
                )}>
                  {step > i + 1 ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-6 h-px", step > i + 1 ? "bg-accent/50" : "bg-white/10")} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center gap-8 px-4 py-8 md:py-12 max-w-6xl mx-auto w-full">
        <div className="flex-1 max-w-lg w-full">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Jak mają Cię nazywać?</h2>
                <p className="text-foreground-2 text-sm mt-1">Wybierz unikalny nick i wyświetlaną nazwę na rybiapaka.pl</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-2 mb-1.5">
                    Nick <span className="text-red-400">*</span>
                    <span className="ml-2 text-xs text-foreground-2/60">3–20 znaków, litery, cyfry, _ lub -</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-2 text-sm">@</span>
                    <input
                      type="text"
                      value={nick}
                      onChange={(e) => setNick(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 20))}
                      placeholder="twoj_nick"
                      className={cn(
                        "w-full bg-background-4 border rounded-xl pl-8 pr-10 py-3 text-foreground placeholder-foreground-2/40 text-sm outline-none transition-colors",
                        nickStatus === "available" ? "border-accent/60 focus:border-accent" :
                        nickStatus === "taken" || nickStatus === "invalid" ? "border-red-500/60 focus:border-red-500" :
                        "border-white/10 focus:border-white/30"
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                      {nickStatus === "checking" && <span className="text-foreground-2 animate-pulse">…</span>}
                      {nickStatus === "available" && <span className="text-accent">✓</span>}
                      {nickStatus === "taken" && <span className="text-red-400">✗</span>}
                      {nickStatus === "invalid" && nick.length > 0 && <span className="text-red-400">!</span>}
                    </div>
                  </div>
                  {nickStatus === "taken" && <p className="text-xs text-red-400 mt-1">Ten nick jest już zajęty</p>}
                  {nickStatus === "invalid" && nick.length > 0 && <p className="text-xs text-red-400 mt-1">Nick może zawierać tylko litery, cyfry, _ i - (min. 3 znaki)</p>}
                  {nickStatus === "available" && <p className="text-xs text-accent mt-1">Nick jest dostępny 🎣</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-2 mb-1.5">Wyświetlana nazwa</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 32))}
                    placeholder="Twoja pełna nazwa"
                    className="w-full bg-background-4 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-foreground-2/40 text-sm outline-none focus:border-white/30 transition-colors"
                  />
                  <p className="text-xs text-foreground-2/60 mt-1">Może być inna niż nick (np. "Jan Kowalski")</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-2 mb-1.5">Zaimki <span className="text-foreground-2/50">(opcjonalne)</span></label>
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value.slice(0, 30))}
                    placeholder="np. on/jego"
                    className="w-full bg-background-4 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-foreground-2/40 text-sm outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold text-sm transition-all",
                  canProceedStep1
                    ? "bg-accent text-black hover:bg-accent/90 shadow-[0_0_20px_rgba(0,206,0,0.3)]"
                    : "bg-background-4 text-foreground-2/50 cursor-not-allowed"
                )}
              >
                Dalej →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Twój awatar</h2>
                <p className="text-foreground-2 text-sm mt-1">Wgraj własne zdjęcie lub wybierz domyślny awatar wędkarski</p>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setAvatarDragActive(true); }}
                onDragLeave={() => setAvatarDragActive(false)}
                onDrop={handleAvatarDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-4 transition-all cursor-pointer group",
                  avatarDragActive ? "border-accent bg-accent/5" : "border-white/10 hover:border-white/20 bg-background-4/50"
                )}
                onClick={() => document.getElementById("avatar-input")?.click()}
              >
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageFile(f, "avatar");
                    e.target.value = "";
                  }}
                />
                {avatarPreview ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-accent/30">
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-background-3 border-4 border-dashed border-white/20 flex items-center justify-center text-3xl">
                    🎣
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm text-foreground font-medium">
                    {avatarPreview ? "Zmień awatar" : "Wgraj awatar"}
                  </p>
                  <p className="text-xs text-foreground-2/60 mt-1">JPG, PNG, WebP · max 2 MB</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground-2 mb-3">Lub wybierz awatar wędkarski:</p>
                <div className="grid grid-cols-5 gap-2">
                  {DEFAULT_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      onClick={() => { setAvatarFile(null); setAvatarPreview(av.src); }}
                      className={cn(
                        "aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105",
                        avatarPreview === av.src ? "border-accent shadow-[0_0_12px_rgba(0,206,0,0.4)]" : "border-white/10 hover:border-white/30"
                      )}
                    >
                      <img src={av.src} alt={av.id} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-xl text-sm font-medium text-foreground-2 bg-background-4 hover:text-foreground transition-colors"
                >
                  ← Wróć
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-accent text-black hover:bg-accent/90 shadow-[0_0_20px_rgba(0,206,0,0.3)] transition-all"
                >
                  Dalej →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Baner profilu</h2>
                <p className="text-foreground-2 text-sm mt-1">Dodaj baner w tle profilu — możesz go pominąć i ustawić później</p>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setBannerDragActive(true); }}
                onDragLeave={() => setBannerDragActive(false)}
                onDrop={handleBannerDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-2xl overflow-hidden transition-all cursor-pointer",
                  bannerDragActive ? "border-accent bg-accent/5" : "border-white/10 hover:border-white/20"
                )}
                onClick={() => document.getElementById("banner-input")?.click()}
              >
                <input
                  id="banner-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageFile(f, "banner");
                    e.target.value = "";
                  }}
                />
                {bannerPreview ? (
                  <div className="relative h-36">
                    <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">Zmień baner</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-36 flex flex-col items-center justify-center gap-2 bg-background-4/50">
                    <span className="text-3xl">🌊</span>
                    <p className="text-sm text-foreground font-medium">Wgraj baner</p>
                    <p className="text-xs text-foreground-2/60">JPG, PNG, WebP · max 5 MB · zalecane 1500×500 px</p>
                  </div>
                )}
              </div>

              {bannerPreview && (
                <button
                  onClick={() => { setBannerFile(null); setBannerPreview(""); }}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Usuń baner
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-3 rounded-xl text-sm font-medium text-foreground-2 bg-background-4 hover:text-foreground transition-colors"
                >
                  ← Wróć
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-accent text-black hover:bg-accent/90 shadow-[0_0_20px_rgba(0,206,0,0.3)] transition-all"
                >
                  Dalej →
                </button>
              </div>

              <p className="text-center text-xs text-foreground-2/50">
                <button onClick={() => setStep(4)} className="underline hover:text-foreground-2 transition-colors">
                  Pomiń ten krok
                </button>
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">O Tobie</h2>
                <p className="text-foreground-2 text-sm mt-1">Powiedz społeczności co Cię łączy z wędkarstwem</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-2 mb-1.5">
                    Bio <span className="text-foreground-2/50">(opcjonalne)</span>
                    <span className="ml-2 text-xs text-foreground-2/40">{bio.length}/200</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 200))}
                    placeholder="Kilka słów o sobie, ulubionych łowiskach, rekordach..."
                    rows={4}
                    className="w-full bg-background-4 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-foreground-2/40 text-sm outline-none focus:border-white/30 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-2 mb-1.5">Wiek <span className="text-foreground-2/50">(opcjonalne)</span></label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="np. 35"
                      min={13}
                      max={99}
                      className="w-full bg-background-4 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-foreground-2/40 text-sm outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-2 mb-1.5">Województwo <span className="text-foreground-2/50">(opcjonalne)</span></label>
                    <select
                      value={regionId}
                      onChange={(e) => setRegionId(e.target.value)}
                      className="w-full bg-background-4 border border-white/10 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-white/30 transition-colors appearance-none"
                    >
                      <option value="">Wybierz...</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-2 mb-2">
                    Techniki wędkarskie <span className="text-foreground-2/50">(opcjonalne)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {methods.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => toggleMethod(m.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          selectedMethods.includes(m.id)
                            ? "bg-accent/20 border-accent/60 text-accent"
                            : "bg-background-4 border-white/10 text-foreground-2 hover:border-white/30"
                        )}
                      >
                        🎣 {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="rounded-xl bg-red-900/20 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {submitError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  disabled={isSubmitting}
                  className="px-5 py-3 rounded-xl text-sm font-medium text-foreground-2 bg-background-4 hover:text-foreground transition-colors disabled:opacity-50"
                >
                  ← Wróć
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-accent text-black hover:bg-accent/90 shadow-[0_0_20px_rgba(0,206,0,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Zapisywanie…" : "🎣 Gotowe! Zacznij przygodę"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block w-80 sticky top-8">
          <div className="space-y-3">
            <p className="text-xs font-medium text-foreground-2/60 uppercase tracking-wider">Podgląd profilu</p>
            <ProfilePreview
              nick={nick}
              name={name}
              pronouns={pronouns}
              bio={bio}
              age={age}
              avatarUrl={avatarPreview}
              bannerUrl={bannerPreview}
              regionName={regionName}
              methodNames={methodNames}
            />
            <p className="text-xs text-foreground-2/40 text-center">Tak widzą Cię inni użytkownicy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
