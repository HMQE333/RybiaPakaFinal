"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import FormButton from "@/components/Form/FormButton";
import FormErrorMessage from "@/components/Form/FormErrorMessage";
import FormInput from "@/components/Form/FormInput";
import FormVisibilityButton from "@/components/Form/FormVisibilityButton";
import Logo from "@/components/Logo";
import Page from "@/components/Page";

type Status = "idle" | "submitting" | "success";

function ResetPasswordContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<number>(0);
  const isSubmittingRef = useRef(false);
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const initialError = searchParams.get("error");

  const errorMessages: Record<number, { title: string; message: string }> = {
    1: {
      title: "Brak tokenu",
      message: "Link do resetu hasła jest nieprawidłowy lub wygasł.",
    },
    2: {
      title: "Hasła nie pasują",
      message: "Wpisz identyczne hasło w obu polach.",
    },
    3: {
      title: "Hasło za krótkie",
      message: "Hasło musi mieć co najmniej 8 znaków.",
    },
    4: {
      title: "Błąd resetu",
      message: "Nie udało się zresetować hasła. Spróbuj ponownie później.",
    },
  };

  const initialErrorInfo = initialError
    ? initialError === "INVALID_TOKEN"
      ? errorMessages[1]
      : errorMessages[4]
    : null;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setStatus("submitting");
    setErrorMessage(0);

    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      const password = String(data.get("password") ?? "");
      const confirmPassword = String(data.get("confirmPassword") ?? "");

      if (!token) {
        setErrorMessage(1);
        setStatus("idle");
        return;
      }

      if (!password || !confirmPassword || password !== confirmPassword) {
        setErrorMessage(2);
        setStatus("idle");
        return;
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body?.message === "PASSWORD_TOO_SHORT") {
          setErrorMessage(3);
        } else if (body?.message === "INVALID_TOKEN") {
          setErrorMessage(1);
        } else {
          setErrorMessage(4);
        }
        setStatus("idle");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setErrorMessage(4);
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
          <p className="text-[16px]">Ustaw nowe hasło</p>
          <p className="text-[12px] text-foreground-2 max-w-[260px]">
            Wpisz nowe hasło i potwierdź zmianę.
          </p>
        </div>

        {initialErrorInfo && (
          <FormErrorMessage
            title={initialErrorInfo.title}
            message={initialErrorInfo.message}
          />
        )}

        {errorMessage !== 0 && errorInfo && (
          <FormErrorMessage
            title={errorInfo.title}
            message={errorInfo.message}
          />
        )}

        {status === "success" && (
          <div className="w-full px-[15px] py-[10px] rounded-lg border border-emerald-500 bg-emerald-500/10 text-[12px] text-foreground">
            Hasło zostało zmienione. Możesz się teraz zalogować.
          </div>
        )}

        <form onSubmit={onSubmit} className="w-full flex flex-col gap-[10px]">
          <div className="relative">
            <FormInput
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Nowe hasło"
              minLength={8}
              autoComplete="new-password"
            />
            <FormVisibilityButton
              visible={showPassword}
              setVisible={setShowPassword}
            />
          </div>

          <div className="relative">
            <FormInput
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Powtórz hasło"
              minLength={8}
              autoComplete="new-password"
            />
            <FormVisibilityButton
              visible={showPassword}
              setVisible={setShowPassword}
            />
          </div>

          <FormButton
            title={status === "submitting" ? "Zapisywanie..." : "Zapisz hasło"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
