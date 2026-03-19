"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import FormButton from "@/components/Form/FormButton";
import FormErrorMessage from "@/components/Form/FormErrorMessage";
import FormInput from "@/components/Form/FormInput";
import Logo from "@/components/Logo";
import Page from "@/components/Page";

type Status = "idle" | "submitting" | "success";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<number>(0);
  const isSubmittingRef = useRef(false);

  const errorMessages: Record<number, { title: string; message: string }> = {
    1: {
      title: "Brak e-maila",
      message: "Podaj adres e-mail, aby wysłać link resetu hasła.",
    },
    2: {
      title: "Niepoprawny e-mail",
      message: "Podaj poprawny adres e-mail.",
    },
    3: {
      title: "Błąd wysyłki",
      message: "Nie udało się wysłać linku. Spróbuj ponownie później.",
    },
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setStatus("submitting");
    setErrorMessage(0);

    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      const email = String(data.get("email") ?? "").trim();

      if (!email) {
        setErrorMessage(1);
        setStatus("idle");
        return;
      }

      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo: "/reset-hasla" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body?.message === "INVALID_EMAIL") {
          setErrorMessage(2);
        } else {
          setErrorMessage(3);
        }
        setStatus("idle");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setErrorMessage(3);
      setStatus("idle");
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const errorInfo = errorMessage ? errorMessages[errorMessage] : null;

  return (
    <Page type="form" header={false}>
      <div className="w-[360px] max-w-full flex flex-col gap-[12px] text-center">
        <div className="flex flex-col items-center gap-[10px] mb-[10px]">
          <Logo size={70} />
          <p className="text-[16px]">Odzyskaj hasło</p>
          <p className="text-[12px] text-foreground-2 max-w-[260px]">
            Wyślemy link do ustawienia nowego hasła.
          </p>
        </div>

        {errorMessage !== 0 && errorInfo && (
          <FormErrorMessage
            title={errorInfo.title}
            message={errorInfo.message}
          />
        )}

        {status === "success" && (
          <div className="w-full px-[15px] py-[10px] rounded-lg border border-emerald-500 bg-emerald-500/10 text-[12px] text-foreground">
            Jeśli e-mail istnieje, wysłaliśmy link do resetu hasła.
          </div>
        )}

        <form onSubmit={onSubmit} className="w-full flex flex-col gap-[10px]">
          <FormInput id="email" type="email" placeholder="E-mail" autoComplete="email" />

          <FormButton
            title={status === "submitting" ? "Wysyłanie..." : "Wyślij link"}
            disabled={status === "submitting"}
          />
        </form>

        <div className="text-[12px] text-foreground-2">
          <Link href="/logowanie" className="hover:underline">
            Wróć do logowania
          </Link>
        </div>
      </div>
    </Page>
  );
}
