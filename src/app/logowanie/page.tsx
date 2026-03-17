"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import FormButton from "@/components/Form/FormButton";
import FormErrorMessage from "@/components/Form/FormErrorMessage";
import FormInput from "@/components/Form/FormInput";
import FormVisibilityButton from "@/components/Form/FormVisibilityButton";
import OAuthButton from "@/components/Form/FormOAuthButton";
import Logo from "@/components/Logo";
import Page from "@/components/Page";
import { emitAuthEvent } from "@/lib/authEvents";
import { writeAuthHint } from "@/lib/authState";

export default function LogInPage() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef(false);

  const router = useRouter();

  const errorMessages: Record<number, { title: string; message: string }> = {
    // 0: success
    1: {
      title: "Hasło niepoprawne",
      message: "Sprawdź hasło i spróbuj ponownie.",
    },
    2: {
      title: "Nie znaleziono konta",
      message: "Nie mamy konta z tym adresem e-mail.",
    },
    3: {
      title: "Brak danych",
      message: "Podaj e-mail i hasło.",
    },
    4: {
      title: "Konto bez hasła",
      message: "To konto nie ma hasła. Użyj logowania przez dostawcę.",
    },
    5: {
      title: "Niepoprawny e-mail",
      message: "Podaj poprawny adres e-mail.",
    },
    6: {
      title: "Błąd logowania",
      message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
    },
    7: {
      title: "Zbyt wiele prób",
      message: "Za dużo nieudanych prób logowania. Spróbuj ponownie za 15 minut.",
    },
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(0);

    try {
      const form = e.currentTarget as HTMLFormElement;
      const data = new FormData(form);

      const email = String(data.get("email") ?? "").trim();
      const password = String(data.get("password") ?? "");

      if (!email || !password) {
        setErrorMessage(3);
        return;
      }

      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const code = data?.message ?? "";

        if (
          code === "ACCOUNT_NOT_FOUND" ||
          code === "USER_NOT_FOUND" ||
          res.status === 404
        ) {
          setErrorMessage(2);
          return;
        }

        if (
          code === "ACCOUNT_NO_PASSWORD" ||
          code === "CREDENTIAL_ACCOUNT_NOT_FOUND"
        ) {
          setErrorMessage(4);
          return;
        }

        if (code === "INVALID_PASSWORD") {
          setErrorMessage(1);
          return;
        }

        if (code === "INVALID_EMAIL") {
          setErrorMessage(5);
          return;
        }

        if (code === "INVALID_BODY") {
          setErrorMessage(3);
          return;
        }

        if (
          code === "INVALID_EMAIL_OR_PASSWORD" ||
          res.status === 401 ||
          res.status === 403
        ) {
          setErrorMessage(1);
          return;
        }

        if (code === "TOO_MANY_REQUESTS" || res.status === 429) {
          setErrorMessage(7);
          return;
        }

        setErrorMessage(6);
        return;
      }

      const nextParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      const safeNext =
        nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
          ? nextParam
          : "/";

      writeAuthHint(true);
      emitAuthEvent("login");
      window.location.href = safeNext;
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const startSocial = async (provider: string) => {
    setErrorMessage(0);

    const res = await fetch("/api/auth/sign-in/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ provider, callbackURL: "/" }),
    }).catch(() => null);

    const data = await res?.json().catch(() => null);
    if (data?.url) {
      window.location.href = data.url;
    } else {
      setErrorMessage(6);
    }
  };

  const errorInfo = errorMessage ? errorMessages[errorMessage] : null;

  return (
    <Page type="form" header={false}>
      <div className="w-[360px] max-w-full flex flex-col gap-[12px] text-center">
        <div className="flex flex-col items-center gap-[10px] mb-[10px]">
          <Logo size={70} />
          <p className="text-[16px]">Witaj z powrotem</p>

          <div className="flex items-center justify-center gap-[10px] text-[12px]">
            <p className="text-foreground-2">Nie masz konta?</p>
            <Link
              href="/rejestracja"
              className="text-foreground hover:underline"
            >
              Zarejestruj się
            </Link>
          </div>
        </div>

        {errorMessage !== 0 && errorInfo && (
          <div className="w-full">
            <FormErrorMessage
              title={errorInfo.title}
              message={errorInfo.message}
            />
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="w-full flex flex-col items-center justify-center gap-[10px]"
        >
          <FormInput id="email" type="email" placeholder="E-mail" />

          <div className="w-full relative">
            <FormInput
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Hasło"
            />
            <FormVisibilityButton
              visible={showPassword}
              setVisible={setShowPassword}
            />
          </div>

          <Link
            href="/odzyskaj-haslo"
            className="text-[12px] text-foreground-2 hover:underline"
          >
            Zapomniałeś hasła?
          </Link>

          <FormButton title="Zaloguj się" disabled={isSubmitting} />
        </form>

        <div className="w-full flex items-center justify-center gap-[10px]">
          <div className="w-full h-[2px] bg-background-4 rounded-r-full" />
          <p className="text-[12px] text-gray-400">ALBO</p>
          <div className="w-full h-[2px] bg-background-4 rounded-l-full" />
        </div>

        <div className="w-full flex items-center justify-center gap-[10px] ">
          <OAuthButton icon="google" onClick={() => startSocial("google")} />
          <OAuthButton icon="facebook" onClick={() => startSocial("facebook")} />
          <OAuthButton icon="discord" onClick={() => startSocial("discord")} />
        </div>
      </div>
    </Page>
  );
}
