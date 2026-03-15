"use client";

import { CheckCircle2, Sparkles, Clock, Shield } from "lucide-react";

import Page from "@/components/Page";

type Section = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const sections: Section[] = [
  {
    title: "Regulamin Forum",
    paragraphs: [
      "Niniejszy regulamin (dalej: Regulamin) określa zasady korzystania z internetowego forum dyskusyjnego o tematyce wędkarskiej (dalej: Forum) oraz prawa i obowiązki zarejestrowanych użytkowników Forum (dalej: Użytkownicy) i podmiotu zarządzającego Forum (dalej: Administrator). Regulamin został sporządzony w zgodzie z przepisami prawa Rzeczypospolitej Polskiej, w szczególności z ustawą z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną, ustawą z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych, Kodeksem cywilnym z dnia 23 kwietnia 1964 r. oraz z uwzględnieniem przepisów prawa Unii Europejskiej, w tym Rozporządzenia (UE) 2016/679 (RODO).",
      "Administratorem i usługodawcą świadczącym usługi Forum jest podmiot zarządzający Forum (dalej także jako Usługodawca). Dane kontaktowe Administratora podano w sekcji 11 Regulaminu. Administrator świadczy usługi drogą elektroniczną polegające na udostępnianiu platformy Forum zgodnie z niniejszym Regulaminem.",
      "Korzystanie z Forum jest dobrowolne. Rejestracja na Forum (założenie konta Użytkownika) jest wymagana do uzyskania pełnego dostępu do funkcji Forum, w tym do tworzenia postów i innych treści. Przeglądanie publicznie dostępnych treści Forum może być możliwe bez rejestracji (wedle ustawień Administratora), jednak aktywne uczestnictwo (dodawanie postów, komentarzy itp.) wymaga posiadania konta Użytkownika.",
      "Rozpoczęcie korzystania z Forum przez Użytkownika, w tym dokonanie rejestracji konta, jest równoznaczne z potwierdzeniem zapoznania się z niniejszym Regulaminem i akceptacją wszystkich jego postanowień. Użytkownik zobowiązuje się do przestrzegania postanowień Regulaminu przez cały okres korzystania z Forum. W przypadku braku akceptacji Regulaminu Użytkownik powinien powstrzymać się od korzystania z Forum.",
      "Świadczenie podstawowych usług Forum na rzecz Użytkowników ma charakter nieodpłatny. Forum może jednak oferować opcjonalne płatne funkcje lub usługi dodatkowe, o których mowa w sekcji 8 Regulaminu. Skorzystanie z usług płatnych wymaga uiszczenia opłaty zgodnie z cennikiem lub opisem danej usługi.",
      "Forum służy wymianie informacji, doświadczeń i opinii związanych z wędkarstwem. Niedopuszczalne jest wykorzystywanie Forum w sposób sprzeczny z jego przeznaczeniem, w szczególności do prowadzenia działalności komercyjnej niezwiązanej z tematyką Forum. Forum nie zawiera wydzielonej sekcji ogłoszeń handlowych – publikowanie ofert kupna, sprzedaży lub reklam towarów i usług przez Użytkowników jest zabronione (zob. szczegółowe zasady w sekcji 4 i 5).",
      "Użytkownicy zobowiązani są korzystać z Forum w sposób zgodny z przepisami powszechnie obowiązującego prawa, zasadami współżycia społecznego oraz dobrymi obyczajami. Zabronione jest dostarczanie przez Użytkowników treści bezprawnych. Korzystanie z Forum nie może naruszać praw osób trzecich ani prawnie chronionych dóbr innych Użytkowników czy Administratora.",
      "Wszelkie prawa własności intelektualnej do elementów Forum, takich jak układ strony, oprogramowanie, logo, nazwa Forum itp., należą do Administratora lub zostały mu legalnie udostępnione. Chronione prawem autorskim materiały udostępniane przez Administratora w ramach Forum (np. oficjalne artykuły, opracowania, grafiki) nie mogą być kopiowane ani rozpowszechniane przez Użytkowników bez uprzedniej wyraźnej zgody Administratora, za wyjątkiem dozwolonego użytku przewidzianego przez prawo.",
      "Regulamin jest dostępny nieodpłatnie na stronie internetowej Forum. Administrator zapewnia możliwość pozyskania, odtwarzania i utrwalania treści Regulaminu przez Użytkownika (np. poprzez wydrukowanie lub zapisanie na trwałym nośniku).",
      "Jeżeli którekolwiek z postanowień Regulaminu okaże się w świetle obowiązującego prawa nieważne lub nieskuteczne, pozostałe postanowienia pozostają w mocy. W miejsce nieważnego postanowienia stosowane będzie odpowiednie obowiązujące prawo. Niniejszy Regulamin nie wyłącza ani nie ogranicza żadnych bezwzględnie obowiązujących praw konsumenckich przysługujących Użytkownikom, którzy posiadają status konsumentów w rozumieniu przepisów prawa (w szczególności ustawy o prawach konsumenta).",
    ],
  },
  {
    title: "Definicje",
    paragraphs: ["Poniższe pojęcia użyte w Regulaminie oznaczają:"],
    bullets: [
      "Forum – internetowe forum dyskusyjne o tematyce wędkarskiej, udostępniane przez Administratora za pośrednictwem strony internetowej (serwisu) i umożliwiające Użytkownikom zamieszczanie oraz wymianę informacji, opinii i innych treści.",
      "Administrator (również: Usługodawca) – podmiot zarządzający i prowadzący Forum, odpowiedzialny za utrzymanie Forum i świadczenie usług na jego rzecz. Administratorem jest także administrator danych osobowych Użytkowników w rozumieniu RODO (szczegóły w sekcji 10).",
      "Użytkownik – osoba fizyczna posiadająca pełną zdolność do czynności prawnych (ewentualnie ograniczoną zdolność, za zgodą przedstawiciela ustawowego), która dokonała rejestracji konta na Forum lub w inny sposób korzysta z funkcjonalności Forum.",
      "Konto Użytkownika – indywidualny profil Użytkownika w ramach Forum, tworzony podczas rejestracji, umożliwiający logowanie i korzystanie z funkcji Forum.",
      "Rejestracja – proces zakładania Konta Użytkownika na Forum, wymagający akceptacji Regulaminu i zgód na przetwarzanie danych osobowych w zakresie niezbędnym do świadczenia usług.",
      "Moderator – osoba wyznaczona przez Administratora, nadzorująca dyskusje i treści na Forum, uprawniona do moderacji oraz działań porządkowych.",
      "Treści lub Materiały – wszelkie treści zamieszczane na Forum przez Użytkowników, w tym posty, komentarze, zdjęcia, pliki audio/wideo i inne materiały multimedialne.",
      "Usługi dodatkowe (Funkcje płatne) – usługi lub funkcjonalności Forum wykraczające poza podstawowe, bezpłatne korzystanie z Forum, udostępniane Użytkownikom za opłatą.",
      "RODO – Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r.",
      "Ustawa o świadczeniu usług drogą elektroniczną (UŚUDE) – ustawa z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną.",
      "Kodeks cywilny – ustawa z dnia 23 kwietnia 1964 r. – Kodeks cywilny.",
      "Ustawa o prawach konsumenta – ustawa z dnia 30 maja 2014 r. o prawach konsumenta.",
      "Pozostałe terminy z wielkiej litery użyte w Regulaminie, które nie zostały powyżej zdefiniowane, należy rozumieć zgodnie z ich definicją legalną lub kontekstem Regulaminu.",
    ],
  },
  {
    title: "Rejestracja i konto użytkownika",
    paragraphs: [
      "Warunki rejestracji: Z usług Forum mogą korzystać wyłącznie osoby, które dokonają prawidłowej rejestracji Konta Użytkownika. Rejestracja jest możliwa dla osób fizycznych posiadających pełną zdolność do czynności prawnych. Osoby niepełnoletnie powyżej 16 roku życia mogą dokonać rejestracji wyłącznie za zgodą swojego przedstawiciela ustawowego, przy czym rejestracja i korzystanie z Forum przez osoby poniżej 16 roku życia jest niedozwolone.",
      "Proces rejestracji: Rejestracja następuje poprzez wypełnienie elektronicznego formularza rejestracyjnego udostępnionego na stronie Forum. Użytkownik zobowiązany jest podać dane prawdziwe i aktualne.",
      "Akceptacja Regulaminu i Polityki Prywatności: W trakcie rejestracji Użytkownik potwierdza zapoznanie się z treścią Regulaminu i akceptuje jego postanowienia, a także wyraża zgody wymagane do świadczenia usług.",
      "Ochrona dostępu: Użytkownik powinien zachować w poufności hasło do swojego Konta i nie udostępniać go osobom trzecim.",
      "Unikalność konta: Jedna osoba fizyczna może posiadać co najwyżej jedno Konto Użytkownika na Forum, chyba że Administrator wyrazi zgodę na posiadanie więcej niż jednego konta.",
      "Aktualizacja danych: Użytkownik zobowiązuje się do utrzymywania swoich danych podanych przy rejestracji w aktualności.",
      "Usunięcie konta przez Użytkownika: Użytkownik ma prawo w każdej chwili zrezygnować z korzystania z Forum i usunąć swoje Konto.",
      "Zawieszenie lub usunięcie konta przez Administratora: Administrator może zawiesić lub usunąć Konto w przypadku naruszenia Regulaminu, braku aktywności lub innych ważnych przyczyn.",
    ],
  },
  {
    title: "Zasady korzystania z Forum",
    paragraphs: ["Użytkownik zobowiązany jest korzystać z Forum w sposób zgodny z prawem, Regulaminem i netykietą. Zabronione są w szczególności:"],
    bullets: [
      "Destabilizacja pracy serwisu (np. próby łamania zabezpieczeń, rozprzestrzenianie malware, przeciążanie serwera).",
      "Spam i niechciane treści, w tym cross-posting i masowe publikowanie powtarzalnych treści.",
      "Naruszanie dóbr osobistych, mowa nienawiści, groźby, nękanie.",
      "Podszywanie się i naruszenie prywatności innych osób.",
      "Działalność komercyjna i reklama bez zgody Administratora.",
      "Nieuprawniony dostęp do kont lub zasobów Forum.",
      "Naruszanie zasad netykiety i celowe dezorganizowanie dyskusji.",
      "Inne zachowania sprzeczne z prawem lub dobrymi obyczajami.",
    ],
  },
  {
    title: "Publikowanie treści (w tym zdjęć i multimediów)",
    paragraphs: [
      "Użytkownicy mogą publikować treści związane z tematyką wędkarstwa oraz pokrewnymi zainteresowaniami, zgodne z tematyką działu i wątku.",
      "Użytkownik ponosi pełną odpowiedzialność za publikowane treści i oświadcza, że posiada prawa do ich rozpowszechniania.",
    ],
    bullets: [
      "Prawa autorskie: zakaz publikacji cudzych utworów bez zgody właściciela praw, poza dozwolonym użytkiem.",
      "Wizerunek i dane osobowe: publikacja wymaga odpowiedniej zgody osób przedstawionych lub podstawy prawnej.",
      "Treści bezprawne i szkodliwe: zakaz treści nawołujących do nienawiści, przemocy, treści obscenicznych i pornograficznych z udziałem nieletnich.",
      "Naruszenie dóbr osobistych: zakaz zniesławień, zniewag i ataków personalnych.",
      "Prywatność i tajemnica korespondencji: zakaz publikowania cudzej korespondencji bez zgody stron.",
      "Linki i odesłania: zakaz linków do treści nielegalnych, szkodliwych lub reklamowych.",
      "Treści nieprawdziwe i szkodliwe porady: zakaz rozpowszechniania fałszywych informacji.",
      "Format i wielkość załączników: obowiązują limity i wymogi techniczne ustalone przez Administratora.",
    ],
  },
  {
    title: "Odpowiedzialność użytkowników",
    paragraphs: [
      "Użytkownik ponosi odpowiedzialność za działania i treści publikowane na Forum.",
      "Administrator jako host provider nie odpowiada za treści Użytkowników do momentu uzyskania wiarygodnej informacji o ich bezprawności i niezwłocznego zablokowania dostępu.",
      "Administrator nie gwarantuje prawdziwości informacji publikowanych przez Użytkowników; korzystanie z porad odbywa się na własne ryzyko.",
      "Administrator nie odpowiada za problemy techniczne po stronie Użytkownika ani za szkody pośrednie w zakresie dopuszczalnym przez prawo.",
    ],
  },
  {
    title: "Moderacja i sankcje",
    paragraphs: [
      "Administrator i Moderatorzy sprawują nadzór nad przestrzeganiem Regulaminu oraz utrzymaniem porządku na Forum.",
      "Moderatorzy mogą usuwać lub modyfikować treści naruszające Regulamin lub prawo.",
    ],
    bullets: [
      "Upomnienie prywatne lub ostrzeżenie formalne.",
      "Czasowa moderacja postów lub blokada konta.",
      "Stała blokada konta w przypadku poważnych naruszeń.",
      "Ograniczenie funkcjonalności lub blokada IP w przypadku nadużyć.",
      "Prawo odwołania od decyzji moderacyjnej zgodnie z sekcją 11.",
    ],
  },
  {
    title: "Płatności i usługi dodatkowe",
    paragraphs: [
      "Podstawowe korzystanie z Forum jest bezpłatne. Forum może oferować dobrowolne usługi dodatkowe (płatne).",
      "Informacje o cenach, czasie trwania usług i metodach płatności są udostępniane przed zakupem.",
      "Konsument ma prawo do odstąpienia od umowy w terminie 14 dni, z wyjątkami określonymi w ustawie o prawach konsumenta.",
      "Reklamacje usług płatnych są rozpatrywane zgodnie z procedurą w sekcji 11.",
    ],
  },
  {
    title: "Prawa autorskie i licencje",
    paragraphs: [
      "Prawa do elementów Forum należą do Administratora lub podmiotów, które udzieliły licencji.",
      "Publikując treści na Forum, Użytkownik udziela Administratorowi niewyłącznej, nieodpłatnej licencji na ich wykorzystanie w ramach działania Forum.",
      "Baza danych Forum jest chroniona, a wydobywanie istotnych części bez zgody Administratora jest zabronione.",
    ],
  },
  {
    title: "Ochrona danych osobowych",
    paragraphs: [
      "Administratorem danych osobowych Użytkowników jest Administrator serwisu. Dane przetwarzane są zgodnie z RODO oraz ustawą o ochronie danych osobowych.",
      "Zakres danych obejmuje m.in. adres e-mail, login, hasło (zaszyfrowane), adres IP, dane profilowe oraz informacje o płatnościach (w zakresie niezbędnym do realizacji usług).",
      "Użytkownikom przysługują prawa określone w RODO, w tym prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych, sprzeciwu i wycofania zgody.",
      "Szczegóły przetwarzania danych znajdują się w Polityce Prywatności.",
    ],
  },
  {
    title: "Reklamacje i kontakt",
    paragraphs: [
      "Kontakt z Administratorem: rybiapaka@gmail.com.",
      "Reklamacje należy składać drogą elektroniczną lub pisemną, z opisem problemu i oczekiwanym sposobem rozwiązania.",
      "Administrator rozpatruje reklamacje niezwłocznie, nie później niż w ciągu 14 dni od daty otrzymania zgłoszenia.",
      "Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji, w tym platformy ODR: https://ec.europa.eu/consumers/odr.",
    ],
  },
  {
    title: "Zmiany Regulaminu",
    paragraphs: [
      "Administrator zastrzega sobie prawo do wprowadzania zmian w Regulaminie z ważnych przyczyn (np. zmiana przepisów prawa, funkcjonalności Forum, danych Administratora).",
      "O planowanych zmianach Użytkownicy zostaną poinformowani z wyprzedzeniem, z podaniem daty wejścia w życie nowej wersji.",
      "Brak sprzeciwu i dalsze korzystanie z Forum po dacie wejścia zmian oznacza akceptację nowej wersji Regulaminu.",
    ],
  },
  {
    title: "Postanowienia końcowe",
    paragraphs: [
      "Prawem właściwym dla umowy jest prawo Rzeczypospolitej Polskiej.",
      "Spory z Użytkownikami niebędącymi konsumentami rozstrzygają sądy właściwe dla siedziby Administratora, a z konsumentami – sądy właściwe według przepisów ogólnych.",
      "Regulamin obowiązuje od dnia 1 stycznia 2026 r. i jest dostępny na stronie Forum.",
      "Kontakt i świadczenie pomocy: Administrator dba o prawidłowe działanie Forum i służy pomocą Użytkownikom.",
    ],
  },
];

const quickRules = [
  "Szanuj innych, zero personalnych atakow.",
      "Nie duplikuj tematów - sprawdź, czy podobny wątek już istnieje.",
      "Oznaczaj NSFW i kontrowersyjne treści.",
  "Przestrzegaj prawa autorskiego i podawaj zrodla.",
];

export default function RegulationsPage() {
  return (
    <Page>
      <main className="w-full flex flex-col items-center pt-[180px] pb-16 px-4">
        <section className="w-full max-w-6xl space-y-10">
          <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3 via-background-2 to-background-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)] px-6 md:px-10 py-10">
            <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_15%_20%,rgba(0,206,0,0.12),transparent_40%)]" />
            <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_85%_10%,rgba(0,133,0,0.14),transparent_40%)]" />
            <div className="relative grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-foreground-2">
                  <span className="px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent">
                    Regulamin
                  </span>
                  <span className="px-3 py-1 rounded-full border border-white/10 bg-background-4 text-foreground-2">
                    Forum internetowe
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Regulamin Forum
                  </h1>
                  <p className="text-base text-foreground-2 leading-relaxed max-w-3xl">
                    Zasady korzystania z forum wedkarskiego, prawa i obowiazki
                    Użytkowników oraz Administratora.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-foreground-2">
                    <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                      Zgodnosc z prawem
                    </span>
                    <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                      Moderacja
                    </span>
                    <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                      Prawa autorskie
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 text-sm">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-foreground-2">
                    Moderacja
                  </p>
                  <p className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-accent" />
                    Aktywna 24/7
                  </p>
                  <p className="text-xs text-foreground-2">
                    Zgłoszenia trafiają do zespołu jak wątek na forum.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-background border border-background-4 shadow-inner space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-foreground-2">
                    Szybki skrot
                  </p>
                  <div className="space-y-1 text-xs text-foreground-2">
                    {quickRules.map((rule) => (
                      <div key={rule} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="space-y-6">
            <div className="space-y-6">
              {sections.map((section) => (
                <article
                  key={section.title}
                  className="relative overflow-hidden rounded-2xl border border-background-4 bg-background-3/70 p-6 shadow-lg interactive-card"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/6 via-transparent to-background pointer-events-none" />
                  <div className="relative space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-1 rounded-full bg-accent animate-pulse" />
                      <h2 className="text-xl font-semibold text-foreground">
                        {section.title}
                      </h2>
                    </div>
                    <div className="space-y-3 text-foreground-2">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                      {section.bullets && section.bullets.length > 0 && (
                        <ul className="list-disc pl-5 space-y-2">
                          {section.bullets.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-background-3/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] grid gap-3 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/12 border border-accent/30 flex items-center justify-center text-accent">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Zgłoszenia
                  </p>
                  <p className="text-xs text-foreground-2">
                    Korzystaj z formularza w dziale Zgłoś problem.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/12 border border-accent/30 flex items-center justify-center text-accent">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Aktualizacje
                  </p>
                  <p className="text-xs text-foreground-2">
                    Nowe zmiany trafiaja do sekcji Informacje / Aktualnosci.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/12 border border-accent/30 flex items-center justify-center text-accent">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Dobry ton
                  </p>
                  <p className="text-xs text-foreground-2">
                    Pisz jak na forum: z szacunkiem, konkretnie, bez floodu.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </Page>
  );
}
