"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BottomCTA() {
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [revealEmail, setRevealEmail] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();

    setSavedEmail(null);
    setRevealEmail(false);

    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setStatus("error");
      setMessage("Podaj poprawny adres e-mail.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        setStatus("error");
        setMessage("Nie udało się zapisać. Spróbuj ponownie.");
        return;
      }

      await res.json().catch(() => ({}));
      setStatus("success");
      setSavedEmail(trimmed);
      setMessage("Już zapisałeś się do newslettera.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Nie udało się zapisać. Spróbuj ponownie.");
    }
  };

  return (
    <section className="w-full py-24 px-4 bg-[var(--background-2)] border-t border-[var(--background-3)]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-[var(--foreground)] mb-6">
          Podoba Ci się to, co widzisz? <br />
          <span className="text-[var(--accent)]">Zapisz się do newslettera.</span>
        </h2>
        <p className="text-lg text-[var(--foreground-2)] mb-10 max-w-2xl mx-auto">
          Jedna wiadomość raz na jakiś czas: nowości, konkursy, poradniki i
          aktualizacje serwisu.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <label className="sr-only" htmlFor="newsletter-email">
            Adres e-mail
          </label>
          <input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            placeholder="Twój e-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full sm:w-[340px] rounded-full border border-white/10 bg-background-3 px-5 py-3 text-foreground placeholder:text-foreground-2 focus:border-accent/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className={cn(
              "px-8 py-3 rounded-full font-bold text-lg transition-all duration-300",
              "bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] hover:scale-105 shadow-xl shadow-[var(--accent)]/20",
              status === "loading" && "opacity-70 cursor-wait"
            )}
          >
            {status === "loading" ? "Zapisywanie..." : "Zapisz się"}
          </button>
        </form>

        {message && (
          <p
            className={cn(
              "mt-4 text-sm",
              status === "success" ? "text-emerald-300" : "text-rose-300"
            )}
            aria-live="polite"
          >
            {message}
          </p>
        )}

        {status === "success" && savedEmail && (
          <div className="mt-3 flex flex-col items-center gap-2 text-sm text-foreground-2">
            <div className="flex items-center gap-2">
              <span>Twój mail:</span>
              <span
                className={cn(
                  "rounded-full border border-white/10 bg-background-3/70 px-3 py-1 text-foreground transition",
                  !revealEmail && "blur-sm select-none"
                )}
              >
                {savedEmail}
              </span>
              <button
                type="button"
                onClick={() => setRevealEmail((prev) => !prev)}
                className="rounded-full border border-white/10 bg-background-3/70 p-2 text-foreground-2 hover:text-foreground transition"
                aria-label={
                  revealEmail ? "Ukryj adres e-mail" : "Pokaż adres e-mail"
                }
              >
                {revealEmail ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
