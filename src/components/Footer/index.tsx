import Logo from "../Logo";
import FooterButton from "./FooterButton";

export default function Footer() {
  return (
    <footer className="w-full bg-background border-t-2 border-background-3">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-start gap-3">
            <Logo size={60} />

            <p className="text-[14px]">RybiaPaka.pl</p>

            <div className="flex flex-col">
              <p className="text-[13px] text-gray-500">
                Najlepsze Forum Wędkarskie w Sieci!
              </p>
              <p className="text-[13px] text-gray-500">rybiapaka@gmail.com</p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <p className="text-[13px] font-medium">Strony</p>

            <div className="flex flex-col">
              <FooterButton title="Strona Główna" href="/" />
              <FooterButton title="Dyskusje" href="/dyskusje" />
              <FooterButton title="Forum" href="/forum" />
              <FooterButton title="Galeria" href="/galeria" />
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <p className="text-[13px] font-medium">Kontakt</p>

            <div className="flex flex-col">
              <FooterButton title="Kontakt" href="/kontakt" />
              <FooterButton title="Zgłoś problem" href="/zglos-problem" />
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <p className="text-[13px] font-medium">Inne</p>

            <div className="flex flex-col">
              <FooterButton title="Informacje" href="/informacje" />
              <FooterButton title="FAQ" href="/faq" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-background-3">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <div className="flex flex-col gap-2 text-xs text-foreground-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <FooterButton title="Regulamin" href="/regulamin" />
              <FooterButton
                title="Polityka prywatności"
                href="/polityka-prywatnosci"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


