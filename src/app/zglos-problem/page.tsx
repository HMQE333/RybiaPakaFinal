"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

import FormButton from "@/components/Form/FormButton";
import FormErrorMessage from "@/components/Form/FormErrorMessage";
import FormInput from "@/components/Form/FormInput";
import FormSelector from "@/components/Form/FormSelector";
import Logo from "@/components/Logo";
import Page from "@/components/Page";

type ReportReason = {
  value: string;
  label: string;
  description: string;
};

const reportReasons: ReportReason[] = [
  {
    value: "bug",
    label: "Zgłoś błąd strony",
    description: "Znalazłem/am błąd lub problem techniczny",
  },
  {
    value: "user",
    label: "Zgłoś użytkownika",
    description: "Użytkownik narusza regulamin lub zasady społeczności",
  },
  {
    value: "suggestion",
    label: "Zaproponuj sugestię",
    description: "Mam pomysł na ulepszenie platformy",
  },
  {
    value: "content",
    label: "Nieodpowiednia treść",
    description: "Post lub komentarz zawiera niedozwolone treści",
  },
  {
    value: "spam",
    label: "Spam lub reklama",
    description: "Wykryłem/am spam lub niedozwoloną reklamę",
  },
  { value: "other", label: "Inne", description: "Inny powód zgłoszenia" },
];

function ReportForm() {
  const searchParams = useSearchParams();
  const [reportType, setReportType] = useState<string>("");
  const [reportTitle, setReportTitle] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  );

  useEffect(() => {
    const type = searchParams.get("type");
    const target = searchParams.get("target");

    if (type) setReportType(type);
    if (target) setReportTitle(`Zgłoszenie użytkownika ${target}`);
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStatus("submitting");

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      reason: String(data.get("reportType") ?? "").trim(),
      title: String(data.get("reportTitle") ?? "").trim(),
      description: String(data.get("content") ?? "").trim(),
      context: String(data.get("context") ?? "").trim(),
      attachmentUrl: String(data.get("attachmentUrl") ?? "").trim(),
      targetType: searchParams.get("type") ?? undefined,
      targetId: searchParams.get("target") ?? undefined,
    };

    if (!payload.reason || !payload.title) {
      setError("Uzupełnij rodzaj i tytuł zgłoszenia.");
      setStatus("idle");
      return;
    }

    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(
        typeof body?.error === "string"
          ? body.error
          : "Nie udało się zapisać zgłoszenia."
      );
      setStatus("idle");
      return;
    }

    setStatus("success");
    form.reset();
    setReportType("");
    setReportTitle("");
  };

  const quickReasons = useMemo(() => reportReasons.slice(0, 4), []);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3 via-background-2 to-background-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)] px-6 md:px-10 py-10">
        <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_15%_20%,rgba(0,206,0,0.16),transparent_35%)]" />
        <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_85%_10%,rgba(0,180,0,0.12),transparent_35%)]" />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-foreground-2">
              <span className="px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent">
                Zgłoś problem
              </span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-background-4 text-foreground-2">
                Wsparcie
              </span>
              <span className="px-3 py-1 rounded-full border border-background-4 bg-background-3/60 text-foreground-2">
                Bez nachodzenia
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Logo size={52} />
                <p className="text-xs text-foreground-2">
                  Zgłoszenie trafia bezpośrednio do moderatorów
                </p>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Opisz problem, a my zajmiemy się resztą
              </h1>
              <p className="text-base text-foreground-2 leading-relaxed max-w-3xl">
                Formularz jak na forum: jasne kategorie, przejrzyste pola i
                szybka wysyłka. Dodaj link, zaszyfruj szczegóły i wrzuć zrzut
                ekranu, by przyspieszyć reakcję.
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-foreground-2">
                <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                  Odpowiedź w 24h
                </span>
                <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                  Priorytet dla bezpieczeństwa
                </span>
                <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                  Współpraca z moderatorami
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 text-sm">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow-inner flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-foreground-2 text-[11px] uppercase tracking-wide">
                  Najnowsze
                </p>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                Zgłoszenia
              </p>
              <p className="text-xs text-foreground-2">
                Sprawdzamy jak nowe wątki: każde zgłoszenie ma opiekuna i status
                jak w dyskusji.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-background border border-background-4 shadow-inner flex flex-col gap-3">
              <p className="text-foreground-2 text-[11px] uppercase tracking-wide">
                Średni czas reakcji
              </p>
              <p className="text-2xl font-semibold text-foreground">
                Czas reakcji
              </p>
              <ul className="text-xs text-foreground-2 space-y-1 list-disc list-inside">
                <li>Ping do moderatora</li>
                <li>Odpowiedź na mail / DM</li>
                <li>Aktualizacja statusu jak w wątku</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="relative rounded-3xl border border-white/10 bg-background-3/80 shadow-[0_20px_60px_rgba(0,0,0,0.28)] p-6 md:p-8">
        <div className="absolute inset-0 pointer-events-none rounded-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(0,206,0,0.06),transparent_40%)]" />
        <div className="relative grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-foreground-2">
              <MessageSquare size={16} className="text-accent" />
              <span>
                Wypełnij detale jak w wątku na forum - klarownie i bez ścisku.
              </span>
            </div>

            {error && <FormErrorMessage message={error} />}
            {status === "success" && (
              <div className="w-full px-4 py-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500 text-sm text-foreground">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>Dziękujemy, dodaliśmy zgłoszenie do kolejki.</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="w-full grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormSelector
                  id="reportType"
                  placeholder="Wybierz powód zgłoszenia..."
                  options={reportReasons}
                  defaultValue={reportType}
                  value={reportType}
                  onChange={(value) => setReportType(value)}
                />

                <FormInput
                  id="reportTitle"
                  type="text"
                  placeholder="Nazwa zgłoszenia..."
                  defaultValue={reportTitle}
                />
              </div>

              <FormInput
                id="content"
                type="text"
                placeholder="Opisz dokładnie problem..."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput
                  id="attachmentUrl"
                  type="text"
                  placeholder="Link do zrzutu ekranu (opcjonalnie)"
                  required={false}
                />
                <FormInput
                  id="context"
                  type="text"
                  placeholder="Link do posta/komentarza lub ID użytkownika (opcjonalnie)"
                  required={false}
                />
              </div>

              <div className="flex flex-col gap-2 text-xs text-foreground-2 bg-background rounded-xl border border-background-4 p-3">
                <span className="font-semibold text-foreground">
                  Jak moderujemy?
                </span>
                <span>
                  1) Automatyczny podgląd, 2) szybki ping moderatora, 3)
                  odpowiedź na mail/DM.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-1 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setReportType("");
                    setReportTitle("");
                    setError(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-background-4 text-sm text-foreground-2 hover:text-foreground hover:border-accent/40 transition"
                >
                  Wyczyść
                </button>
                <FormButton
                  title={
                    status === "submitting"
                      ? "Wysyłanie..."
                      : "Wyślij zgłoszenie"
                  }
                  disabled={status === "submitting"}
                  iconRight={<ArrowRight size={16} />}
                  fullWidth={false}
                  className="w-full sm:w-auto"
                />
              </div>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="p-4 rounded-2xl border border-background-4 bg-background shadow-inner">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Szybkie powody
                </p>
                <span className="text-[11px] text-foreground-2 px-2 py-1 rounded-full border border-background-4 bg-background-3/70">
                  klimat forum
                </span>
              </div>
              <p className="text-xs text-foreground-2 mt-2">
                Kliknij jak na liście dyskusji - wybierz kategorie, a poniżej
                dopisz szczegóły.
              </p>
              <div className="flex flex-wrap gap-2 pt-3">
                {quickReasons.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => setReportType(reason.value)}
                    className={`text-xs px-3 py-2 rounded-full border transition ${
                      reportType === reason.value
                        ? "border-accent text-accent bg-accent/10"
                        : "border-background-4 text-foreground-2 hover:border-accent/50 hover:text-foreground"
                    }`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner space-y-2">
                <p className="text-xs uppercase tracking-wide text-foreground-2">
                  Panel moderatora
                </p>
                <p className="text-lg font-semibold text-foreground">
                  Zgłoszenie złapiemy jak w wątku
                </p>
                <p className="text-xs text-foreground-2">
                  Stan zgłoszenia zapisujemy jak post na forum - nic się nie
                  zlewa i wiemy, kto odpowiada.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-background border border-background-4 shadow-inner space-y-2">
                <p className="text-xs uppercase tracking-wide text-foreground-2">
                  Lista kontrolna
                </p>
                <ul className="text-xs text-foreground-2 space-y-1 list-disc list-inside">
                  <li>Link do wątku lub profilu</li>
                  <li>Zrzut ekranu, gdy coś się rozsypuje</li>
                  <li>Dokładny opis - bez chaosu</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Page>
      <main className="w-full flex flex-col items-center pt-[160px] pb-16 px-4">
        <section className="w-full max-w-6xl space-y-8">
          <Suspense
            fallback={
              <div className="min-h-[260px] flex items-center justify-center text-sm text-foreground-2">
                Ładowanie formularza...
              </div>
            }
          >
            <ReportForm />
          </Suspense>
        </section>
      </main>
    </Page>
  );
}
