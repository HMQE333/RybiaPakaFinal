"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DEFAULT_AVATARS } from "@/lib/avatarDefaults";
import { cn } from "@/utils";

type MethodOption = { id: string; name: string };

type WizardUser = {
  nick: string | null;
  pronouns: string | null;
  bio: string | null;
  ageRange: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  methods: string[];
};

type Props = {
  user: WizardUser;
  methods: MethodOption[];
};

type NickStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const NICK_REGEX = /^[a-zA-Z0-9_\-]{3,20}$/;

const STEPS = [
  { label: "Nick", icon: "🪪" },
  { label: "O sobie", icon: "🎣" },
  { label: "Awatar", icon: "🖼️" },
  { label: "Baner", icon: "🌊" },
];

const AGE_RANGES = [
  { value: "do 18", label: "do 18 lat" },
  { value: "18–25", label: "18–25 lat" },
  { value: "26–35", label: "26–35 lat" },
  { value: "36–45", label: "36–45 lat" },
  { value: "46–55", label: "46–55 lat" },
  { value: "56+", label: "56 lat i więcej" },
];

const PRESET_BANNERS = [
  {
    id: "gleboka-woda",
    label: "Głęboka woda",
    gradient: "linear-gradient(135deg, #001a3a 0%, #003a7a 50%, #0055aa 100%)",
  },
  {
    id: "zielony-las",
    label: "Zielony las",
    gradient: "linear-gradient(135deg, #002200 0%, #004d00 50%, #007a00 100%)",
  },
  {
    id: "zachod-slonca",
    label: "Zachód słońca",
    gradient: "linear-gradient(135deg, #4a0800 0%, #aa2200 40%, #ff6600 100%)",
  },
  {
    id: "mgla-poranna",
    label: "Mgła poranna",
    gradient: "linear-gradient(135deg, #0d0d1a 0%, #1a2040 50%, #2d3a6e 100%)",
  },
  {
    id: "torfowisko",
    label: "Torfowisko",
    gradient: "linear-gradient(135deg, #1a0d00 0%, #3d2a00 50%, #5c4020 100%)",
  },
  {
    id: "rzeka",
    label: "Rzeka",
    gradient: "linear-gradient(135deg, #001a1a 0%, #004d50 50%, #007a7d 100%)",
  },
];

function ProfilePreview({
  nick, pronouns, bio, ageRange, avatarUrl, bannerStyle, methodNames,
}: {
  nick: string; pronouns: string; bio: string; ageRange: string;
  avatarUrl: string; bannerStyle: React.CSSProperties; methodNames: string[];
}) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-background-3 shadow-2xl">
      <div className="relative h-[120px] flex-shrink-0" style={bannerStyle} />
      <div className="px-4 pb-4">
        <div className="relative -mt-10 mb-3">
          <div className="w-[76px] h-[76px] rounded-full border-4 border-background-3 overflow-hidden bg-background-4 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">🎣</span>
            )}
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="text-lg font-bold text-foreground leading-tight">
            {nick || <span className="text-foreground-2/40">Twój nick</span>}
          </p>
          {pronouns && <p className="text-xs text-foreground-2/60 italic">{pronouns}</p>}
          {bio && <p className="text-sm text-foreground-2 mt-2 leading-relaxed">{bio}</p>}
        </div>
        {(ageRange || methodNames.length > 0) && (
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
            {ageRange && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background-4 px-3 py-1 text-xs text-foreground-2">
                📅 {ageRange}
              </span>
            )}
            {methodNames.slice(0, 4).map((m) => (
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

export default function OnboardingWizard({ user, methods }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [nick, setNick] = useState(user.nick ?? "");
  const [pronouns, setPronouns] = useState(user.pronouns ?? "");
  const [nickStatus, setNickStatus] = useState<NickStatus>("idle");
  const nickCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckedNick = useRef<string>("");

  const [selectedMethods, setSelectedMethods] = useState<string[]>(user.methods ?? []);
  const [ageRange, setAgeRange] = useState(user.ageRange ?? "");
  const [bio, setBio] = useState(user.bio ?? "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl ?? "");
  const [avatarDragActive, setAvatarDragActive] = useState(false);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState(user.bannerUrl ?? "");
  const [bannerPresetId, setBannerPresetId] = useState<string | null>(null);
  const [bannerDragActive, setBannerDragActive] = useState(false);

  const methodNames = selectedMethods
    .map((id) => methods.find((m) => m.id === id)?.name ?? "")
    .filter(Boolean);

  const bannerStyle: React.CSSProperties = bannerPreview
    ? { background: `url(${bannerPreview}) center/cover no-repeat` }
    : bannerPresetId
    ? { background: PRESET_BANNERS.find((b) => b.id === bannerPresetId)?.gradient ?? "linear-gradient(135deg, #003a00, #00ce00)" }
    : { background: "linear-gradient(135deg, #003a00 0%, #006600 40%, #00ce00 100%)" };

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
    else { setBannerFile(file); setBannerPreview(url); setBannerPresetId(null); }
  };

  const toggleMethod = (id: string) => {
    setSelectedMethods((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canProceedStep1 = nick.length >= 3 &&
    (nickStatus === "available" || (nick === user.nick && nickStatus !== "taken"));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const form = new FormData();
      form.append("nick", nick);
      form.append("name", nick);
      form.append("pronouns", pronouns);
      form.append("bio", bio);
      form.append("ageRange", ageRange);
      form.append("methods", JSON.stringify(selectedMethods));
      if (avatarFile) form.append("avatarFile", avatarFile);
      else if (avatarPreview) form.append("avatarUrl", avatarPreview);
      if (bannerFile) form.append("bannerFile", bannerFile);
      else if (bannerPresetId) form.append("bannerPresetId", bannerPresetId);

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
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-background/95">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="RybiaPaka.pl logo"
            width={44}
            height={44}
            unoptimized
          />
          <div className="flex flex-col">
            <p className="text-[14px] text-accent tracking-wide leading-tight">RybiaPaka.pl</p>
            <p className="text-[11px] text-foreground-2 leading-snug">Zintegrowana Platforma Wędkarska</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                step === i + 1
                  ? "bg-accent text-black"
                  : step > i + 1
                  ? "bg-accent/20 text-accent"
                  : "text-foreground-2/50 bg-transparent"
              )}>
                <span>{step > i + 1 ? "✓" : s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-4 h-px", step > i + 1 ? "bg-accent/40" : "bg-white/10")} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center gap-10 px-4 py-10 max-w-5xl mx-auto w-full">
        <div className="flex-1 max-w-lg w-full">

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Twój nick</h2>
                <p className="text-foreground-2 text-sm mt-1">Nick to Twoja wyświetlana nazwa na rybiapaka.pl — widoczna dla wszystkich</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-2 mb-1.5">
                    Nick <span className="text-red-400">*</span>
                    <span className="ml-2 text-xs text-foreground-2/50">3–20 znaków, litery, cyfry, _ lub -</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-2/50 text-sm font-mono">@</span>
                    <input
                      type="text"
                      value={nick}
                      onChange={(e) => setNick(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 20))}
                      placeholder="twoj_nick"
                      className={cn(
                        "w-full bg-background-4 border rounded-xl pl-8 pr-10 py-3 text-foreground placeholder-foreground-2/30 text-sm outline-none transition-colors",
                        nickStatus === "available" ? "border-accent/60 focus:border-accent" :
                        nickStatus === "taken" || nickStatus === "invalid" ? "border-red-500/60 focus:border-red-500" :
                        "border-white/10 focus:border-white/30"
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                      {nickStatus === "checking" && <span className="text-foreground-2/40 animate-pulse">…</span>}
                      {nickStatus === "available" && <span className="text-accent">✓</span>}
                      {nickStatus === "taken" && <span className="text-red-400">✗</span>}
                      {nickStatus === "invalid" && nick.length > 0 && <span className="text-yellow-400">!</span>}
                    </div>
                  </div>
                  {nickStatus === "taken" && <p className="text-xs text-red-400 mt-1">Ten nick jest już zajęty</p>}
                  {nickStatus === "invalid" && nick.length > 0 && <p className="text-xs text-yellow-400 mt-1">Nick może zawierać tylko litery, cyfry, _ i - (min. 3 znaki)</p>}
                  {nickStatus === "available" && <p className="text-xs text-accent mt-1">Nick jest wolny! 🎣</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-2 mb-1.5">
                    Zaimki <span className="text-foreground-2/40 text-xs">(opcjonalne)</span>
                  </label>
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value.slice(0, 30))}
                    placeholder="np. on/jego"
                    className="w-full bg-background-4 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-foreground-2/30 text-sm outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold text-sm transition-all",
                  canProceedStep1
                    ? "bg-accent text-black hover:bg-accent/90 shadow-[0_0_24px_rgba(0,206,0,0.25)]"
                    : "bg-background-4 text-foreground-2/40 cursor-not-allowed"
                )}
              >
                Dalej →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">O sobie</h2>
                <p className="text-foreground-2 text-sm mt-1">Powiedz społeczności co Cię łączy z wędkarstwem — wszystko opcjonalne</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground-2 mb-2">
                    Kategorie wędkarstwa
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {methods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMethod(m.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          selectedMethods.includes(m.id)
                            ? "bg-accent/20 border-accent/60 text-accent shadow-[0_0_8px_rgba(0,206,0,0.2)]"
                            : "bg-background-4 border-white/10 text-foreground-2 hover:border-white/25 hover:text-foreground"
                        )}
                      >
                        🎣 {m.name}
                      </button>
                    ))}
                  </div>
                  {methods.length === 0 && (
                    <p className="text-xs text-foreground-2/40">Brak dostępnych kategorii</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-2 mb-2">
                    Przedział wiekowy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {AGE_RANGES.map((range) => (
                      <button
                        key={range.value}
                        type="button"
                        onClick={() => setAgeRange(ageRange === range.value ? "" : range.value)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-medium border transition-all text-center",
                          ageRange === range.value
                            ? "bg-accent/20 border-accent/60 text-accent"
                            : "bg-background-4 border-white/10 text-foreground-2 hover:border-white/25 hover:text-foreground"
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-2 mb-1.5">
                    Opis konta
                    <span className="ml-2 text-xs text-foreground-2/40">{bio.length}/200</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 200))}
                    placeholder="Kilka słów o sobie, ulubionych łowiskach, rekordach..."
                    rows={4}
                    className="w-full bg-background-4 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-foreground-2/30 text-sm outline-none focus:border-white/30 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl text-sm font-medium text-foreground-2 bg-background-4 hover:text-foreground transition-colors">← Wróć</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-accent text-black hover:bg-accent/90 shadow-[0_0_24px_rgba(0,206,0,0.25)] transition-all">Dalej →</button>
              </div>
              <p className="text-center text-xs text-foreground-2/40">
                <button onClick={() => setStep(3)} className="underline hover:text-foreground-2">Pomiń ten krok</button>
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Twój awatar</h2>
                <p className="text-foreground-2 text-sm mt-1">Wgraj własne zdjęcie lub wybierz domyślny awatar wędkarski</p>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setAvatarDragActive(true); }}
                onDragLeave={() => setAvatarDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setAvatarDragActive(false); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f, "avatar"); }}
                onClick={() => document.getElementById("avatar-input")?.click()}
                className={cn(
                  "relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-4 transition-all cursor-pointer",
                  avatarDragActive ? "border-accent bg-accent/5" : "border-white/10 hover:border-white/20 bg-background-4/40"
                )}
              >
                <input id="avatar-input" type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f, "avatar"); e.target.value = ""; }} />
                {avatarPreview ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-accent/30">
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-background-3 border-4 border-dashed border-white/20 flex items-center justify-center text-3xl">🎣</div>
                )}
                <div className="text-center">
                  <p className="text-sm text-foreground font-medium">{avatarPreview ? "Zmień awatar" : "Wgraj awatar"}</p>
                  <p className="text-xs text-foreground-2/40 mt-1">JPG, PNG, WebP · max 2 MB</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground-2 mb-3">Lub wybierz awatar wędkarski:</p>
                <div className="grid grid-cols-5 gap-2">
                  {DEFAULT_AVATARS.map((av) => (
                    <button key={av.id} type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(av.src); }}
                      className={cn("aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105",
                        avatarPreview === av.src ? "border-accent shadow-[0_0_12px_rgba(0,206,0,0.4)]" : "border-white/10 hover:border-white/30")}>
                      <img src={av.src} alt={av.id} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-5 py-3 rounded-xl text-sm font-medium text-foreground-2 bg-background-4 hover:text-foreground transition-colors">← Wróć</button>
                <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-accent text-black hover:bg-accent/90 shadow-[0_0_24px_rgba(0,206,0,0.25)] transition-all">Dalej →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Baner profilu</h2>
                <p className="text-foreground-2 text-sm mt-1">Wybierz gotowy motyw wędkarski, wgraj własny lub zostaw bez banera</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-foreground-2/60 uppercase tracking-wider">Gotowe motywy</p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_BANNERS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => { setBannerPresetId(preset.id); setBannerFile(null); setBannerPreview(""); }}
                      className={cn(
                        "relative h-16 rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02]",
                        bannerPresetId === preset.id && !bannerPreview
                          ? "border-accent shadow-[0_0_12px_rgba(0,206,0,0.4)]"
                          : "border-white/10 hover:border-white/30"
                      )}
                      style={{ background: preset.gradient }}
                    >
                      <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-white/70 font-medium drop-shadow">
                        {preset.label}
                      </span>
                      {bannerPresetId === preset.id && !bannerPreview && (
                        <span className="absolute top-1 right-1 bg-accent text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="relative border-2 border-dashed rounded-2xl overflow-hidden transition-all cursor-pointer"
                  style={bannerDragActive ? { borderColor: "#00ce00", background: "rgba(0,206,0,0.05)" } : { borderColor: "rgba(255,255,255,0.1)" }}
                  onDragOver={(e) => { e.preventDefault(); setBannerDragActive(true); }}
                  onDragLeave={() => setBannerDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setBannerDragActive(false); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f, "banner"); }}
                  onClick={() => document.getElementById("banner-input")?.click()}
                >
                  <input id="banner-input" type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f, "banner"); e.target.value = ""; }} />
                  {bannerPreview ? (
                    <div className="relative h-24">
                      <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">Zmień własny baner</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center gap-2 bg-background-4/40">
                      <span className="text-xl">📁</span>
                      <div>
                        <p className="text-sm text-foreground font-medium">Wgraj własny baner</p>
                        <p className="text-xs text-foreground-2/40">JPG, PNG, WebP · max 5 MB · zalecane 1500×500 px</p>
                      </div>
                    </div>
                  )}
                </div>

                {(bannerPresetId || bannerPreview) && (
                  <button
                    type="button"
                    onClick={() => { setBannerPresetId(null); setBannerFile(null); setBannerPreview(""); }}
                    className="text-xs text-foreground-2/50 hover:text-red-400 transition-colors"
                  >
                    Usuń baner (zostaw domyślny)
                  </button>
                )}
              </div>

              {submitError && (
                <div className="rounded-xl bg-red-900/20 border border-red-500/30 px-4 py-3 text-sm text-red-400">{submitError}</div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} disabled={isSubmitting} className="px-5 py-3 rounded-xl text-sm font-medium text-foreground-2 bg-background-4 hover:text-foreground transition-colors disabled:opacity-50">← Wróć</button>
                <button onClick={handleSubmit} disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-accent text-black hover:bg-accent/90 shadow-[0_0_24px_rgba(0,206,0,0.25)] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? "Zapisywanie…" : "🎣 Gotowe! Zacznij przygodę"}
                </button>
              </div>
              <p className="text-center text-xs text-foreground-2/40">
                <button onClick={handleSubmit} disabled={isSubmitting} className="underline hover:text-foreground-2 disabled:opacity-50">Pomiń baner i wejdź</button>
              </p>
            </div>
          )}
        </div>

        <div className="hidden lg:block w-72 sticky top-8">
          <div className="space-y-3">
            <p className="text-xs font-medium text-foreground-2/50 uppercase tracking-wider">Podgląd profilu</p>
            <ProfilePreview
              nick={nick}
              pronouns={pronouns}
              bio={bio}
              ageRange={ageRange}
              avatarUrl={avatarPreview}
              bannerStyle={bannerStyle}
              methodNames={methodNames}
            />
            <p className="text-xs text-foreground-2/30 text-center">Tak widzą Cię inni użytkownicy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
