"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import FormButton from "@/components/Form/FormButton";
import FormErrorMessage from "@/components/Form/FormErrorMessage";
import FormInput from "@/components/Form/FormInput";
import FormVisibilityButton from "@/components/Form/FormVisibilityButton";
import OAuthButton from "@/components/Form/FormOAuthButton";
import Logo from "@/components/Logo";
import Page from "@/components/Page";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef(false);

  const router = useRouter();

  const errorMessages: Record<number, { title: string; message: string }> = {
    // 0: sukces
    1: {
      title: "Hasła nie pasują",
      message: "Wpisz identyczne hasło w obu polach.",
    },
    2: {
      title: "E-mail zajęty",
      message: "Ten adres e-mail jest już zarejestrowany.",
    },
    3: {
      title: "Błąd rejestracji",
      message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
    },
    4: {
      title: "Nazwa użytkownika zajęta",
      message: "Wybierz inną nazwę użytkownika.",
    },
    5: {
      title: "Brak danych",
      message: "Podaj nazwę użytkownika, e-mail i hasło.",
    },
    6: {
      title: "Hasło za krótkie",
      message: "Hasło musi mieć co najmniej 8 znaków.",
    },
    7: {
      title: "Niepoprawny e-mail",
      message: "Podaj poprawny adres e-mail.",
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

      const username = String(data.get("username") ?? "").trim();
      const email = String(data.get("email") ?? "").trim();
      const password = String(data.get("password") ?? "");
      const confirmPassword = String(data.get("confirmPassword") ?? "");

      if (!username || !email || !password || !confirmPassword) {
        setErrorMessage(5);
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage(1);
        return;
      }

      const res = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: username,
          email,
          password,
          username,
          nick: username,
          joinedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const code = data?.message ?? "";

        if (
          code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
          code === "USER_ALREADY_EXISTS"
        ) {
          setErrorMessage(2);
          return;
        }

        if (code === "USERNAME_IS_ALREADY_TAKEN") {
          setErrorMessage(4);
          return;
        }

        if (code === "PASSWORD_TOO_SHORT") {
          setErrorMessage(6);
          return;
        }

        if (code === "INVALID_EMAIL") {
          setErrorMessage(7);
          return;
        }

        setErrorMessage(3);
        return;
      }

      router.push("/profil/ustawienia?onboarding=1");
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
      body: JSON.stringify({ provider }),
    }).catch(() => null);

    const data = await res?.json().catch(() => null);
    if (data?.url) {
      window.location.href = data.url;
    } else {
      setErrorMessage(3);
    }
  };

  const errorInfo = errorMessage ? errorMessages[errorMessage] : null;

  return (
    <Page type="form" header={false}>
      <div className="w-[360px] max-w-full flex flex-col gap-[12px] text-center">
        <div className="flex flex-col items-center gap-[10px] mb-[10px]">
          <Logo size={70} />
          <p className="text-[16px]">Dołącz do naszej społeczności</p>
          <p className="text-[12px] text-foreground-2 max-w-[260px]">
            RybiaPaka.pl jest najlepszą społecznością wędkarską w Polsce.
          </p>
          <p className="text-[12px] text-foreground-2 max-w-[260px]">
          </p>
        </div>

        {errorMessage !== 0 && errorInfo && (
          <FormErrorMessage
            title={errorInfo.title}
            message={errorInfo.message}
          />
        )}

        <form onSubmit={onSubmit} className="w-full flex flex-col gap-[10px]">
          <FormInput id="username" type="text" placeholder="Nazwa użytkownika" />
          <FormInput id="email" type="email" placeholder="E-mail" />

          <div className="relative">
            <FormInput
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Hasło"
              title="Minimum 8 znaków."
              minLength={8}
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
              title="Minimum 8 znaków."
              minLength={8}
            />
            <FormVisibilityButton
              visible={showPassword}
              setVisible={setShowPassword}
            />
          </div>

          <FormButton title="Zarejestruj się" disabled={isSubmitting} />
        </form>

        <div className="w-full flex items-center justify-center gap-[10px] mt-[10px]">
          <div className="w-full h-[2px] bg-background-4 rounded-r-full" />
          <p className="text-[12px] text-gray-400">ALBO</p>
          <div className="w-full h-[2px] bg-background-4 rounded-l-full" />
        </div>

        <div className="w-full flex items-center justify-center gap-[10px]">
          <OAuthButton icon="google" onClick={() => startSocial("google")} />
          <OAuthButton icon="discord" onClick={() => startSocial("discord")} />
        </div>
      </div>
    </Page>
  );
}
