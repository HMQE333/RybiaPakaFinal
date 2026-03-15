"use client";

import { Lock, ServerCog, Handshake } from "lucide-react";

import Page from "@/components/Page";

type PolicySection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const sections: PolicySection[] = [
  {
    title: "Polityka Prywatności",
    paragraphs: [
      "Niniejsza Polityka Prywatności opisuje zasady przetwarzania danych osobowych Użytkowników korzystających z naszego forum internetowego, zgodnie z obowiązującym prawem Rzeczypospolitej Polskiej oraz Rozporządzeniem (UE) 2016/679 (RODO).",
      "Dokument ten zawiera informacje o tym, jakie dane zbieramy, w jakim celu je przetwarzamy, na jakiej podstawie prawnej oraz jakie prawa przysługują Użytkownikom. Prosimy o uważne zapoznanie się z poniższymi postanowieniami.",
    ],
  },
  {
    title: "Administrator Danych Osobowych",
    paragraphs: [
      "Administratorem danych osobowych jest Jakub Przewłocki prowadzący serwis forum (dalej: „Administrator”).",
      "Kontakt z Administratorem w sprawach ochrony danych osobowych jest możliwy pod adresem e-mail: rybiapaka@gmail.com lub pisemnie na adres siedziby.",
      "Administrator odpowiada za przetwarzanie Twoich danych osobowych i decyduje o celach oraz środkach ich przetwarzania (w przypadku wyznaczenia Inspektora Ochrony Danych, dane kontaktowe IOD zostaną podane w tym miejscu zgodnie z art. 37 RODO).",
    ],
  },
  {
    title: "Zakres Przetwarzanych Danych Osobowych",
    paragraphs: [
      "W ramach korzystania z forum mogą być zbierane i przetwarzane następujące kategorie danych osobowych Użytkowników:",
    ],
    bullets: [
      "Dane podawane przy rejestracji: adres e-mail oraz wybrana nazwa użytkownika (login). W przypadku rejestracji za pomocą zewnętrznych dostawców (Google, Discord, Facebook) otrzymujemy od tych podmiotów dane niezbędne do utworzenia konta, takie jak adres e-mail oraz identyfikator/profil powiązany z danym serwisem zewnętrznym.",
      "Dane profilowe: informacje dobrowolnie uzupełniane na profilu Użytkownika, np. imię, pseudonim, zdjęcie profilowe (avatar), informacje o sobie lub inne dane, które Użytkownik zdecyduje się podać w ustawieniach konta.",
      "Dane techniczne i teleinformatyczne: adres IP przypisany do urządzenia Użytkownika podczas korzystania z forum, informacje o przeglądarce internetowej, systemie operacyjnym, znacznik czasu wizyty itp. Dane te mogą być automatycznie zapisywane w logach serwera w celach technicznych, statystycznych oraz bezpieczeństwa.",
      "Pliki cookies (ciasteczka): unikalne identyfikatory sesji i inne pliki cookies zapisywane na urządzeniu Użytkownika. Szczegółowe informacje o wykorzystywaniu cookies znajdują się w dalszej części Polityki.",
      "Dane dotyczące aktywności na forum: treści publikowanych postów, komentarzy, wiadomości prywatnych oraz wszelkie inne informacje, które Użytkownik zamieszcza dobrowolnie na forum. Należy pamiętać, że informacje ujawniane publicznie na forum stają się widoczne dla innych Użytkowników – Użytkownik ponosi odpowiedzialność za publikowanie swoich danych osobowych w treści postów.",
      "Dane pozyskane w korespondencji z Administratorem: jeżeli kontaktujesz się z nami poprzez e-mail lub w inny sposób, możemy zachować historię takiej korespondencji wraz z podanymi tam danymi (np. adres e-mail, imię, treść zapytania).",
    ],
  },
  {
    title: "Cele Przetwarzania Danych",
    paragraphs: [
      "Dane osobowe Użytkowników są przetwarzane wyłącznie w określonych celach, zgodnych z prawem i niezbędnych do funkcjonowania forum. W szczególności przetwarzamy dane w następujących celach:",
    ],
    bullets: [
      "Rejestracja i utrzymanie konta Użytkownika: w celu utworzenia konta na forum, zapewnienia mechanizmu logowania (także poprzez zewnętrznych dostawców tożsamości, jeśli Użytkownik wybierze taką opcję) oraz umożliwienia korzystania ze wszystkich funkcjonalności forum (dodawanie postów, komentarzy, edycja profilu itp.).",
      "Świadczenie usług forum i obsługa Użytkowników: aby umożliwić publikowanie treści, komunikację z innymi Użytkownikami, korzystanie z wyszukiwarki, powiadomień oraz innych funkcji serwisu zgodnie z regulaminem forum. Obejmuje to również komunikację z Użytkownikiem w sprawach związanych z funkcjonowaniem forum (np. powiadomienia systemowe o aktywności na koncie, reset hasła, ważne informacje o zmianach w działaniu forum).",
      "Utrzymanie bezpieczeństwa i poprawnego działania serwisu: w celu monitorowania poprawności działania forum, wykrywania ewentualnych nadużyć lub prób nieautoryzowanego dostępu, zapewnienia integralności danych i ochrony przed działaniami naruszającymi prawo lub regulamin forum. Na przykład adresy IP oraz logi aktywności mogą być wykorzystywane do zapobiegania spamowi, atakom typu DDOS, tworzeniu wielu kont przez tę samą osobę wbrew zasadom itp. – wszystko to w ramach działań zapewniających bezpieczeństwo serwisu.",
      "Cele statystyczne i analityczne dotyczące własnego forum: w ograniczonym zakresie możemy przetwarzać dane o korzystaniu z forum (np. liczba odwiedzin, popularność wątków) w celu ulepszania naszych usług i dostosowywania ich do potrzeb Użytkowników. Nie korzystamy z zewnętrznych narzędzi analitycznych, takich jak Google Analytics – ewentualna analiza odbywa się wyłącznie na podstawie zagregowanych danych wewnętrznych i nie służy profilowaniu poszczególnych Użytkowników.",
      "Realizacja obowiązków prawnych: w celu wypełnienia obowiązków wynikających z przepisów prawa, np. przekazania danych uprawnionym organom państwowym na podstawie stosownych przepisów (np. na żądanie policji lub sądu), spełnienia obowiązku archiwizacyjnego czy rachunkowego, jeśli takie znajdą zastosowanie.",
      "Ustalenie, dochodzenie lub obrona roszczeń prawnych: dane mogą być przechowywane i wykorzystywane także w celu ewentualnego ustalenia lub dochodzenia roszczeń związanych z korzystaniem z forum lub obrony przed takimi roszczeniami.",
    ],
  },
  {
    title: "Podstawy Prawne Przetwarzania",
    paragraphs: [
      "Przetwarzamy dane osobowe Użytkowników wyłącznie w sytuacjach, gdy istnieje ku temu podstawa prawna przewidziana przez obowiązujące przepisy, w szczególności art. 6 ust. 1 RODO. W kontekście korzystania z forum internetowego stosujemy następujące podstawy prawne przetwarzania danych:",
    ],
    bullets: [
      "Niezbędność do wykonania umowy (art. 6 ust. 1 lit. b RODO): przetwarzanie danych jest niezbędne do wykonania umowy o świadczenie usług drogą elektroniczną, którą stanowi korzystanie z naszego forum.",
      "Niezbędność wypełnienia obowiązku prawnego (art. 6 ust. 1 lit. c RODO): w niektórych sytuacjach prawo zobowiązuje nas do przetwarzania danych (np. udostępnienia danych organom ścigania na mocy przepisów prawa).",
      "Uzasadniony interes Administratora (art. 6 ust. 1 lit. f RODO): zapewnienie bezpieczeństwa serwisu, ochrona przed nadużyciami, ulepszanie funkcjonalności forum oraz dochodzenie lub obrona przed ewentualnymi roszczeniami.",
      "Zgoda Użytkownika (art. 6 ust. 1 lit. a RODO): nie opieramy przetwarzania danych na odrębnej zgodzie, poza sytuacjami, gdy taka zgoda może być wymagana przez prawo lub dla uruchomienia dodatkowej, opcjonalnej funkcjonalności.",
    ],
  },
  {
    title: "Sprzeciw i cofnięcie zgody",
    paragraphs: [
      "W sytuacji, gdy podstawą przetwarzania jest uzasadniony interes Administratora, masz prawo wnieść sprzeciw wobec takiego przetwarzania. Jeśli podstawą jest zgoda, masz prawo tę zgodę w dowolnym momencie wycofać, co pozostanie bez wpływu na zgodność z prawem wcześniejszego przetwarzania dokonanego przed cofnięciem zgody.",
    ],
  },
  {
    title: "Odbiorcy Danych",
    paragraphs: [
      "Twoje dane osobowe nie są sprzedawane ani udostępniane w celach marketingowych czy komercyjnych podmiotom trzecim. Co do zasady, wszelkie przetwarzane dane pozostają wyłącznie w dyspozycji Administratora.",
      "Istnieją jednak sytuacje, w których dostęp do danych mogą uzyskać lub zostać im przekazane określone podmioty – zawsze w granicach obowiązującego prawa i z poszanowaniem poufności. Do potencjalnych odbiorców danych osobowych mogą należeć:",
    ],
    bullets: [
      "Podmioty przetwarzające dane na zlecenie Administratora: firmy informatyczne zapewniające hosting serwera forum lub utrzymanie infrastruktury IT, firmy świadczące usługi serwisowe czy inne podmioty zapewniające wsparcie techniczne.",
      "Zewnętrzni dostawcy logowania: jeśli zdecydujesz się zarejestrować lub logować za pośrednictwem zewnętrznych serwisów (Google, Facebook, Discord), dane niezbędne do uwierzytelnienia są udostępniane pomiędzy naszym forum a wybranym dostawcą tożsamości.",
      "Organy publiczne i uprawnione instytucje: możemy udostępnić Twoje dane organom ścigania, sądom lub innym upoważnionym podmiotom, jeżeli zobowiązują nas do tego przepisy prawa.",
      "Inne podmioty w ramach prawnie uzasadnionych działań: w razie reorganizacji, połączenia lub przeniesienia działalności forum do innego podmiotu (np. sprzedaż serwisu, zmiana administratora), dane Użytkowników mogą zostać przekazane następcy prawnemu.",
    ],
  },
  {
    title: "Przekazywanie Danych do Państw Trzecich",
    paragraphs: [
      "Dokładamy starań, aby przetwarzać Twoje dane osobowe głównie na terytorium Europejskiego Obszaru Gospodarczego (EOG). Serwery i infrastruktura forum znajdują się (lub są wynajmowane) na terenie Polski lub innych krajów UE, co oznacza, że dane Użytkowników co do zasady nie opuszczają obszaru EOG. Nie planujemy przekazywać danych osobowych do państw trzecich (poza EOG) ani organizacji międzynarodowych.",
      "W pewnych sytuacjach jednak korzystanie z usług zewnętrznych może wiązać się z transferem danych poza EOG, np. przy logowaniu przez Google, Facebooka czy Discorda. W takich przypadkach zapewniamy, że transfer odbywa się zgodnie z wymogami prawa ochrony danych, np. na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską lub innych odpowiednich mechanizmów przewidzianych w RODO.",
      "Użytkownik zostanie poinformowany, jeśli w przyszłości zaistnieje konieczność przekazania jego danych poza EOG w innym celu niż wskazane powyżej.",
    ],
  },
  {
    title: "Okres Przechowywania Danych",
    paragraphs: [
      "Twoje dane osobowe będą przechowywane nie dłużej, niż jest to konieczne do realizacji celów, w których zostały zebrane. Oznacza to, że okres przechowywania może różnić się w zależności od kategorii danych oraz podstawy przetwarzania:",
    ],
    bullets: [
      "Dane konta i profilowe: dane podane przy rejestracji przechowujemy przez cały okres posiadania aktywnego konta na forum. Po usunięciu konta dane są usuwane lub anonimizowane, z wyjątkiem danych, które musimy przechowywać dłużej na podstawie prawa lub prawnie uzasadnionego interesu (np. dla rozpatrzenia roszczeń).",
      "Treści publikowane na forum: wpisy i posty Użytkownika mogą pozostać widoczne na forum po usunięciu konta, jednak będą prezentowane w sposób niepozwalający na identyfikację autora. Na życzenie Użytkownika możemy także usunąć lub zanonimizować treści, które opublikował, o ile usunięcie nie naruszy praw innych Użytkowników czy obowiązków prawnych Administratora.",
      "Dane techniczne i logi: informacje techniczne (logi serwera zawierające np. adresy IP, znaczniki czasu, informacje o błędach) są przechowywane przez okres niezbędny do zapewnienia bezpieczeństwa i prawidłowego funkcjonowania serwisu, standardowo przez [np. 12 miesięcy].",
      "Dane związane z zobowiązaniami prawnymi: jeżeli określone dane przetwarzamy na podstawie obowiązku prawnego, przechowujemy je przez okres wymagany odpowiednimi przepisami.",
      "Dane przetwarzane na podstawie uzasadnionego interesu: przechowujemy je do czasu przedawnienia potencjalnych roszczeń cywilnoprawnych (standardowo 6 lat dla roszczeń powstałych po 2018 r.).",
      "Dane przetwarzane na podstawie zgody: będą przechowywane do momentu wycofania zgody przez Użytkownika lub osiągnięcia celu, dla którego zostały zebrane.",
    ],
  },
  {
    title: "Prawa Użytkownika",
    paragraphs: [
      "Każdemu Użytkownikowi przysługują prawa związane z przetwarzaniem danych osobowych. Twoje prawa obejmują m.in.:",
    ],
    bullets: [
      "Prawo dostępu do danych: możesz uzyskać potwierdzenie, czy przetwarzamy Twoje dane, oraz dostęp do nich i informacji o przetwarzaniu.",
      "Prawo do sprostowania danych: możesz zażądać sprostowania danych nieprawidłowych lub uzupełnienia danych niekompletnych.",
      "Prawo do usunięcia danych („prawo do bycia zapomnianym”): możesz żądać usunięcia danych w przypadkach przewidzianych przez prawo.",
      "Prawo do ograniczenia przetwarzania: możesz żądać wstrzymania operacji na danych w określonych sytuacjach.",
      "Prawo do przenoszenia danych: możesz otrzymać swoje dane w ustrukturyzowanym formacie oraz zlecić ich przesłanie innemu administratorowi.",
      "Prawo sprzeciwu wobec przetwarzania: możesz wnieść sprzeciw wobec przetwarzania danych opartego na uzasadnionym interesie Administratora.",
      "Prawo do wycofania zgody: możesz w dowolnym momencie wycofać zgodę, jeżeli przetwarzanie odbywa się na jej podstawie.",
    ],
  },
  {
    title: "Realizacja praw i skarga",
    paragraphs: [
      "Aby skorzystać ze swoich praw, skontaktuj się z nami (szczegóły w sekcji Kontakt z Administratorem). Na Twój wniosek odpowiemy bez zbędnej zwłoki – co do zasady w terminie do miesiąca od otrzymania żądania (termin ten możemy przedłużyć do dwóch miesięcy w skomplikowanych przypadkach).",
      "Przysługuje Ci prawo wniesienia skargi do organu nadzorczego, jeśli uznasz, że przetwarzanie Twoich danych osobowych narusza przepisy o ochronie danych. W Polsce organem nadzorczym jest Prezes Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa, tel. 22 531 03 00.",
    ],
  },
  {
    title: "Pliki Cookies",
    paragraphs: [
      "Nasze forum używa plików cookies (tzw. ciasteczek), czyli niewielkich plików tekstowych zapisywanych na urządzeniu Użytkownika podczas przeglądania stron internetowych. Cookies wykorzystywane na forum pełnią przede wszystkim funkcje techniczne i usprawniają korzystanie z serwisu.",
      "Poniżej wyjaśniamy, jakie rodzaje plików cookies stosujemy i w jakim celu:",
    ],
    bullets: [
      "Cookies niezbędne (techniczne): konieczne do prawidłowego funkcjonowania forum i realizacji podstawowych funkcji (np. utrzymanie sesji po zalogowaniu, zapamiętanie preferowanych ustawień).",
      "Cookies funkcjonalne: ułatwiają korzystanie z forum poprzez zapamiętanie Twoich wyborów i preferencji (np. motyw graficzny, rozmiar czcionki).",
      "Cookies statystyczne/analityczne: obecnie nie stosujemy zewnętrznych cookies analitycznych (np. Google Analytics); ewentualna analiza odbywa się na podstawie zagregowanych danych wewnętrznych.",
      "Cookies marketingowe: nie wykorzystujemy cookies marketingowych ani reklamowych stron trzecich.",
    ],
  },
  {
    title: "Czas przechowywania i zarządzanie cookies",
    paragraphs: [
      "Sesyjne pliki cookies pozostają na Twoim urządzeniu do czasu wylogowania lub zamknięcia przeglądarki. Cookies stałe, o ile są stosowane, mogą być przechowywane przez określony czas (np. 30 dni, 90 dni, 1 rok) w zależności od swojej funkcji.",
      "Standardowo przeglądarki internetowe domyślnie zezwalają na umieszczanie cookies. Możesz jednak w dowolnym momencie zmienić ustawienia swojej przeglądarki, np. blokować obsługę cookies lub usuwać zapisane cookies.",
      "Pamiętaj, że ograniczenie stosowania cookies może wpłynąć na niektóre funkcjonalności forum, a zablokowanie wszystkich plików cookie może uniemożliwić logowanie lub utrzymanie sesji.",
      "Więcej informacji o cookies i sposobach ich blokowania znajdziesz w sekcji pomocy swojej przeglądarki internetowej.",
    ],
  },
  {
    title: "Bezpieczeństwo Danych",
    paragraphs: [
      "Administrator dokłada najwyższej staranności, aby zapewnić bezpieczeństwo przetwarzanych danych osobowych. Stosujemy odpowiednie środki techniczne i organizacyjne mające na celu ochronę danych przed przypadkowym lub nielegalnym zniszczeniem, utratą, modyfikacją, nieuprawnionym ujawnieniem lub dostępem. Do zabezpieczeń tych należą m.in.:",
    ],
    bullets: [
      "Zastosowanie protokołu SSL/TLS na forum, co umożliwia szyfrowanie transmisji danych pomiędzy Twoją przeglądarką a naszym serwerem (rozpoznasz to po adresie zaczynającym się od \"https://\" oraz ikonie kłódki w pasku adresu).",
      "Zabezpieczenie baz danych i serwerów przed nieautoryzowanym dostępem – dostęp do danych osobowych mają wyłącznie upoważnione osoby i tylko w zakresie niezbędnym do realizacji obowiązków.",
      "Regularne aktualizacje oprogramowania forum oraz innych komponentów systemu w celu załatania znanych podatności bezpieczeństwa.",
      "Wykonywanie kopii zapasowych danych w celu zabezpieczenia przed ich utratą w razie awarii technicznej lub incydentu losowego.",
      "Monitorowanie systemów pod kątem podejrzanej aktywności oraz posiadanie procedur reagowania na incydenty bezpieczeństwa.",
      "Wdrożenie polityk i procedur wewnętrznych z zakresu ochrony danych (w tym szkolenia z zakresu RODO dla osób przetwarzających dane).",
    ],
  },
  {
    title: "Dodatkowe informacje o bezpieczeństwie",
    paragraphs: [
      "Pomimo stosowanych środków, żaden sposób transmisji danych w Internecie ani przechowywania danych elektronicznych nie gwarantuje 100% bezpieczeństwa. Dlatego nie możemy absolutnie zagwarantować bezpieczeństwa informacji przesyłanych za pośrednictwem Internetu.",
      "Masz obowiązek dbać o bezpieczeństwo swoich danych, np. utrzymując w tajemnicy hasło do konta i nie udostępniając go osobom trzecim. Jeśli zauważysz jakiekolwiek incydenty lub zagrożenia bezpieczeństwa związane z korzystaniem z forum, poinformuj nas o tym niezwłocznie.",
    ],
  },
  {
    title: "Dobrowolność Podania Danych",
    paragraphs: [
      "Podanie danych osobowych wymaganych przy rejestracji na forum (takich jak adres e-mail, nazwa użytkownika, hasło) jest dobrowolne, jednakże niezbędne do utworzenia konta i korzystania z forum. Jeżeli nie podasz tych danych, nie będziemy mogli założyć dla Ciebie konta.",
      "Wszelkie dane dodatkowe (np. informacje profilowe, które nie są obowiązkowe) podajesz nam według własnej decyzji. Ich niepodanie pozostaje bez wpływu na podstawowe korzystanie z forum.",
      "Logowanie za pomocą zewnętrznych serwisów (Google, Facebook, Discord) jest dobrowolne – zawsze możesz wybrać standardową rejestrację e-mail zamiast uwierzytelniania zewnętrznego.",
    ],
  },
  {
    title: "Uwaga dla osób poniżej 18 roku życia",
    paragraphs: [
      "Nasze forum jest skierowane do szerokiego grona odbiorców i nie jest specjalnie adresowane do dzieci poniżej 18 roku życia, choć ich udział nie jest zabroniony.",
      "Jeżeli masz mniej niż 18 lat, przed założeniem konta upewnij się, że posiadasz zgodę swojego opiekuna prawnego na udostępnienie danych osobowych. Osobom poniżej 16 roku życia prawo polskie wymaga, by zgodę na przetwarzanie danych osobowych w ramach usług internetowych wyraził lub zatwierdził rodzic bądź opiekun prawny.",
      "Administrator nie weryfikuje wieku każdego Użytkownika, jednak jeżeli okaże się, że osoba poniżej 13 roku życia samodzielnie zarejestrowała konto bez zgody opiekuna, takie konto może zostać zawieszone lub usunięte, a dane – niezwłocznie usunięte.",
    ],
  },
  {
    title: "Kontakt z Administratorem",
    paragraphs: [
      "W razie pytań, wniosków lub żądań dotyczących niniejszej Polityki Prywatności bądź ogólnie kwestii przetwarzania Twoich danych osobowych przez Administratora, zachęcamy do kontaktu:",
    ],
    bullets: [
      "Adres e-mail: rybiapaka@gmail.com.",
      "Formularz kontaktowy na forum oraz wiadomość prywatna do konta Administratora.",
    ],
  },
  {
    title: "Zmiany Polityki Prywatności",
    paragraphs: [
      "Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności w przyszłości, szczególnie w przypadku zmiany przepisów prawa, praktyk organu nadzorczego czy modyfikacji funkcjonalności forum wpływających na zakres przetwarzania danych osobowych.",
      "Wszelkie zmiany zostaną opublikowane w postaci zaktualizowanego tekstu Polityki na stronie forum. O istotnych zmianach możemy również powiadomić Cię poprzez dodatkowe komunikaty (np. e-mail do zarejestrowanych Użytkowników lub informacja wyświetlona po zalogowaniu).",
      "Zachęcamy do okresowego przeglądania Polityki Prywatności, aby być na bieżąco z informacjami o tym, jak chronimy Twoje dane. Data ostatniej aktualizacji: 1 stycznia 2026 r.",
      "Dziękujemy za zapoznanie się z naszą Polityką Prywatności. Bezpieczeństwo Twoich danych jest dla nas ważne, dlatego dokładamy wszelkich starań, abyś mógł czuć się pewnie, korzystając z naszego forum. Jeśli masz dodatkowe pytania lub wątpliwości – pozostajemy do dyspozycji.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <Page>
      <main className="w-full flex flex-col items-center pt-[180px] pb-16 px-4">
        <section className="w-full max-w-6xl space-y-10">
          <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3 via-background-2 to-background-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)] px-6 md:px-10 py-10">
            <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_15%_20%,rgba(0,206,0,0.12),transparent_40%)]" />
            <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_85%_10%,rgba(0,133,0,0.14),transparent_40%)]" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-foreground-2">
                  <span className="px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent">
                    Polityka prywatności
                  </span>
                  <span className="px-3 py-1 rounded-full border border-white/10 bg-background-4 text-foreground-2">
                    Forum internetowe
                  </span>
                  <span className="px-3 py-1 rounded-full border border-background-4 bg-background-3/60 text-foreground-2">
                    RODO
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Polityka Prywatności
                  </h1>
                  <p className="text-base text-foreground-2 leading-relaxed max-w-3xl">
                    Niniejsza Polityka Prywatności określa zasady przetwarzania
                    danych osobowych Użytkowników forum RybiaPaka.pl.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-foreground-2">
                    <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                      Zgodność z RODO
                    </span>
                    <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                      Dane osobowe
                    </span>
                    <span className="rounded-full border border-background-4 px-3 py-1 bg-background-3/60">
                      Prawa Użytkownika
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-sm w-full max-w-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-foreground-2">
                    Administrator
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Jakub Przewłocki
                  </p>
                  <p className="text-xs text-foreground-2">
                    E-mail: rybiapaka@gmail.com
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-foreground-2">
                    Wsparcie
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Kontakt z administratorem
                  </p>
                  <p className="text-xs text-foreground-2">
                    Formularz kontaktowy na forum lub wiadomość prywatna do konta
                    Administratora.
                  </p>
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
                  <Lock size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Dane osobowe
                  </p>
                  <p className="text-xs text-foreground-2">
                    Przetwarzane zgodnie z RODO i jasno opisanymi zasadami.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/12 border border-accent/30 flex items-center justify-center text-accent">
                  <ServerCog size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Bezpieczeństwo
                  </p>
                  <p className="text-xs text-foreground-2">
                    Szyfrowanie, kopie zapasowe i monitoring incydentów.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/12 border border-accent/30 flex items-center justify-center text-accent">
                  <Handshake size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Prawa Użytkownika
                  </p>
                  <p className="text-xs text-foreground-2">
                    Dostęp, sprostowanie, usunięcie i sprzeciw wobec przetwarzania.
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
