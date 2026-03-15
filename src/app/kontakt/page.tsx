"use client";

import Page from "@/components/Page";
import Logo from "@/components/Logo";
import {
  Mail,
  MessageCircle,
  PhoneCall,
  Send,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import React, { useState } from "react";

const supportChannels = [
  {
    title: "Wsparcie społeczności",
    icon: MessageCircle,
    accent: "text-accent",
    bg: "bg-accent/10",
    description:
      "Dołącz do czatu i uzyskaj szybkie odpowiedzi od zespołu i społeczności.",
    action: "Otwórz czat",
    href: "/dyskusje",
  },
  {
    title: "E-mail",
    icon: Mail,
    accent: "text-blue-400",
    bg: "bg-blue-400/10",
    description: "Napisz do nas, jeśli sprawa wymaga kilku zdań więcej.",
    action: "rybiapaka@gmail.com",
    href: "mailto:rybiapaka@gmail.com",
  },
  {
    title: "Partnerstwa",
    icon: PhoneCall,
    accent: "text-amber-300",
    bg: "bg-amber-300/10",
    description: "Wspólne akcje, sponsoring, wydarzenia – pogadajmy!",
    action: "Zadzwoń i umów się na rozmowę!",
    href: "/zglos-problem?type=partnerstwo",
  },
];

const faq = [
  {
    title: "Jak szybko odpisujemy?",
    description:
      "Na czacie zwykle w ciągu 5–15 minut, e-mailowo do 24h w dni robocze.",
    icon: Clock,
  },
  {
    title: "Bezpieczeństwo i zgłoszenia",
    description:
      "Nadużycia, spam lub problemy z kontem możesz zgłosić z poziomu formularza.",
    icon: ShieldCheck,
  },
  {
    title: "Czy możecie pomóc w sprzęcie?",
    description:
      "Jasne. Napisz, jakie łowisko/sprzęt, a damy rekomendacje lub podlinkujemy dyskusje.",
    icon: Sparkles,
  },
];

export default function KontaktPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState("");
  const [partnerOpen, setPartnerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setTimeout(() => {
      setStatus("sent");
      setMessage("");
      setTimeout(() => setStatus("idle"), 2800);
    }, 900);
  };

  return (
    <Page>
      <div className="relative w-full flex flex-col items-center overflow-hidden">
        <div className="contact-glow contact-glow-1" />
        <div className="contact-glow contact-glow-2" />
        <div className="contact-grid" />

        <div className="w-full max-w-6xl pt-[180px] pb-20 px-4 sm:px-6 lg:px-8">
          <header className="mb-12">
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-8 justify-between">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                  Porozmawiajmy o Twoim temacie
                </h1>
                <p className="text-foreground-2 text-lg">
                  Wybierz kanał, zostaw wiadomość albo złap nas na forum.
                  Szybkie reakcje, forumowe mikrointerakcje i zero spamu.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/dyskusje"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold shadow-lg shadow-accent/20 hover:bg-accent-2 transition-colors interactive-press"
                  >
                    <MessageCircle size={18} />
                    Dołącz do czatu
                  </a>
                  <a
                    href="mailto:rybiapaka@gmail.com"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-foreground hover:border-white/20 hover:bg-white/5 transition-colors interactive-press"
                  >
                    <Mail size={18} />
                    Napisz e-mail
                  </a>
                </div>
              </div>

              <div className="flex-shrink-0 mt-6 lg:mt-0 flex items-center justify-center">
                <Logo size={260} />
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-3 mb-12">
            {supportChannels.map((item) => {
              const isPartner = item.title === "Partnerstwa";
              const CardTag = isPartner ? "button" : "a";
              return (
                <CardTag
                  key={item.title}
                  href={isPartner ? undefined : item.href}
                  onClick={(e: React.MouseEvent) => {
                    if (isPartner) {
                      e.preventDefault();
                      setPartnerOpen(true);
                    }
                  }}
                  className="group relative rounded-2xl border border-white/10 bg-background-3/80 p-5 hover:border-white/20 interactive-card text-left w-full"
                >
                  <div
                    className={`w-12 h-12 flex items-center justify-center rounded-xl ${item.bg} ${item.accent}`}
                  >
                    <item.icon size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-2">
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-foreground group-hover:text-foreground">
                    <span>{item.action}</span>
                    <Send
                      size={16}
                      className="opacity-70 group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </CardTag>
              );
            })}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] items-start">
            <div className="relative rounded-2xl border border-white/10 bg-background-3/90 p-6 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-background-2 via-background-3 to-background-2" />
              <div className="relative flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/12 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_0_1px_rgba(0,206,0,0.1)]">
                  <Send size={18} />
                </div>
                <div>
                  <p className="text-sm text-foreground-2">Krótka wiadomość</p>
                  <h3 className="text-lg font-semibold text-foreground">
                    Formularz kontaktowy
                  </h3>
                </div>
              </div>

              <form className="space-y-4 relative" onSubmit={handleSubmit}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-sm text-foreground">
                    Imię
                    <input
                      required
                      name="name"
                      placeholder="Twoje imię"
                      className="w-full bg-background-4 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-2 focus:border-accent/60 focus:outline-none interactive-press"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-foreground">
                    E-mail
                    <input
                      required
                      type="email"
                      name="email"
                      placeholder="rybiapaka@gmail.com"
                      className="w-full bg-background-4 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-2 focus:border-accent/60 focus:outline-none interactive-press"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-sm text-foreground">
                  Temat
                  <input
                    required
                    name="topic"
                    placeholder="W czym możemy pomóc?"
                    className="w-full bg-background-4 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-2 focus:border-accent/60 focus:outline-none interactive-press"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-foreground">
                  Wiadomość
                  <textarea
                    required
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Opisz krótko temat – szybciej pomożemy."
                    className="w-full bg-background-4 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-2 focus:border-accent/60 focus:outline-none min-h-[140px] resize-none interactive-press"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent/90 text-foreground font-semibold shadow-lg shadow-accent/20 hover:bg-accent transition-colors interactive-press disabled:opacity-60"
                  >
                    {status === "sending" ? "Wysyłanie..." : "Wyślij wiadomość"}
                    <Send size={18} />
                  </button>
                  {status === "sent" && (
                    <span className="text-sm text-foreground-2 shimmer-accent px-3 py-1 rounded-lg border border-white/10">
                      Wiadomość wysłana – wrócimy wkrótce.
                    </span>
                  )}
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-background-3/90 p-5 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="text-accent" size={18} />
                  <h3 className="font-semibold text-foreground">
                    Gdzie nas znaleźć?
                  </h3>
                </div>
                <p className="text-sm text-foreground-2">
                  Online 24/7, a w realu najczęściej nad wodą. Spotkasz nas na
                  eventach wędkarskich w całej Polsce – jeśli chcesz się złapać,
                  daj znać!
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-foreground">
                  <div className="p-3 rounded-xl bg-background-4 border border-white/5">
                    <p className="text-foreground-2 text-xs">Godziny</p>
                    <p>12:00–20:00</p>
                    <p className="text-foreground-2 text-xs">pn–nd</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background-4 border border-white/5">
                    <p className="text-foreground-2 text-xs">Hotline</p>
                    <p>+48 798 097 017</p>
                    <p className="text-foreground-2 text-xs">awaryjnie</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-background-3/90 p-5 shadow-xl space-y-3">
                {faq.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-accent">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {item.title}
                      </h4>
                      <p className="text-sm text-foreground-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {partnerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setPartnerOpen(false)}
            />
            <div className="relative w-[min(660px,96vw)] pointer-events-auto animate-partner-pop">
              <div className="rounded-2xl border border-white/10 bg-background-3/95 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
                <div className="absolute -top-12 -right-10 w-56 h-56 bg-accent/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-8 w-64 h-64 bg-amber-300/10 blur-3xl pointer-events-none" />
                <button
                  onClick={() => setPartnerOpen(false)}
                  className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 text-foreground-2 hover:text-foreground transition-colors"
                  aria-label="Zamknij"
                >
                  ×
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center shadow-inner shadow-accent/20">
                    <PhoneCall size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-foreground-2">
                      Partnerstwa / Telefon
                    </p>
                    <h4 className="text-xl font-semibold text-foreground">
                      Zadzwoń i umów się
                    </h4>
                  </div>
                </div>

                <div className="space-y-4 text-sm sm:text-base text-foreground leading-relaxed">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-foreground-2 text-xs uppercase tracking-wide">
                        Telefon
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        +48 798 097 017
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-foreground-2 text-xs uppercase tracking-wide">
                        Godziny
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        12:00–20:00
                      </p>
                    </div>
                  </div>
                  <div className="text-foreground-2 space-y-1">
                    <p>
                      Porozmawiajmy o sponsoringu, wspólnych akcjach lub
                      wydarzeniach.
                    </p>
                    <p>
                      Możemy też przygotować dedykowaną aktywację dla Twojej
                      marki.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <a
                    href="tel:+48798097017"
                    className="flex-1 text-center px-4 py-3 rounded-xl bg-accent text-white font-semibold shadow-lg shadow-accent/20 hover:bg-accent-2 transition-colors interactive-press"
                  >
                    Zadzwoń teraz
                  </a>
                  <a
                    href="/zglos-problem?type=partnerstwo"
                    className="flex-1 text-center px-4 py-3 rounded-xl border border-white/10 text-foreground hover:border-white/20 hover:bg-white/5 transition-colors interactive-press"
                  >
                    Formularz
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
