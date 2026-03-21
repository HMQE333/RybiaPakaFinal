export type SpotType = "pzw" | "dzikie" | "komercyjne";

export type Review = {
  id: string;
  author: string;
  avatarSeed: string;
  rating: number;
  comment: string;
  date: string;
};

export type Tip = {
  id: string;
  author: string;
  icon: string;
  text: string;
  date: string;
};

export type FishEntry = {
  id: string;
  species: string;
  author: string;
  weight?: string;
  photoSeed: string;
  date: string;
  count: number;
};

export type SpotPhoto = {
  id: string;
  seed: string;
  author: string;
  date: string;
  caption?: string;
};

export type MockSpot = {
  id: string;
  name: string;
  type: SpotType;
  lat: number;
  lng: number;
  voivodeship: string;
  description: string;
  coverSeed: string;
  rating: number;
  reviewCount: number;
  lastActivity: string;
  fishSpecies: string[];
  reviews: Review[];
  tips: Tip[];
  fishEntries: FishEntry[];
  photos: SpotPhoto[];
};

export const MOCK_SPOTS: MockSpot[] = [
  {
    id: "sniadwy",
    name: "Jezioro Śniardwy",
    type: "pzw",
    lat: 53.722,
    lng: 21.701,
    voivodeship: "Warmińsko-Mazurskie",
    description:
      "Największe jezioro w Polsce o powierzchni ponad 113 km². Serce Mazur, raj dla wędkarzy. Śniardwy słyną z ogromnych szczupaków i sandaczy. Akwen jest objęty ochroną PZW, wymagane jest zezwolenie. Najlepsze miejsca to zatoki przy wyspach Czarci Ostrów i Szeroki Ostrów.",
    coverSeed: "sniadwy-cover",
    rating: 4.7,
    reviewCount: 142,
    lastActivity: "2 godz. temu",
    fishSpecies: ["szczupak", "sandacz", "okoń", "leszcz", "płoć", "węgorz"],
    reviews: [
      {
        id: "r1",
        author: "Marek_Wedkarz",
        avatarSeed: "marek",
        rating: 5,
        comment:
          "Niesamowite miejsce! Złowiłem szczupaka 94 cm na początku sezonu. Woda czysta, dużo miejsca. Polecam zatokę od strony wschodniej.",
        date: "15 mar 2026",
      },
      {
        id: "r2",
        author: "PiotrFromPoznan",
        avatarSeed: "piotr",
        rating: 4,
        comment:
          "Świetne miejsce na weekend. Sandacze biorą wieczorami na mormyszkę przy głębinach. Presja w sezonie jest jednak duża.",
        date: "8 mar 2026",
      },
      {
        id: "r3",
        author: "KingaW",
        avatarSeed: "kinga",
        rating: 5,
        comment:
          "Byłam tutaj po raz trzeci i za każdym razem coś złowię. Łodzie do wynajęcia w Mikołajkach, ceny przystępne.",
        date: "1 mar 2026",
      },
    ],
    tips: [
      {
        id: "t1",
        author: "Marek_Wedkarz",
        icon: "🎣",
        text: "Szczupaki najlepiej na wobler Rapala CD-9 w kolorze srebro-niebieski, rano w zatoce Czarci Ostrów.",
        date: "15 mar 2026",
      },
      {
        id: "t2",
        author: "ZimowySpin",
        icon: "🚗",
        text: "Dojazd łatwy od Mikołajek. Przy drodze jest duży parking dla samochodów z przyczepą.",
        date: "10 mar 2026",
      },
      {
        id: "t3",
        author: "Nocny_Wedkarz",
        icon: "🌙",
        text: "Na nockę polecam zatokę przy wyspie Wielka Żydówka – mało wiatru i dobre brania węgorzy od 22:00.",
        date: "5 mar 2026",
      },
      {
        id: "t4",
        author: "PiotrFromPoznan",
        icon: "⚠️",
        text: "Uwaga na strefy wyłączone z połowu! Są oznakowane bojami, łatwo wejść przez przypadek.",
        date: "28 lut 2026",
      },
    ],
    fishEntries: [
      {
        id: "f1",
        species: "Szczupak",
        author: "Marek_Wedkarz",
        weight: "4.2 kg",
        photoSeed: "sniadwy-f1",
        date: "15 mar 2026",
        count: 28,
      },
      {
        id: "f2",
        species: "Sandacz",
        author: "PiotrFromPoznan",
        weight: "2.1 kg",
        photoSeed: "sniadwy-f2",
        date: "10 mar 2026",
        count: 19,
      },
      {
        id: "f3",
        species: "Okoń",
        author: "KingaW",
        weight: "0.6 kg",
        photoSeed: "sniadwy-f3",
        date: "2 mar 2026",
        count: 41,
      },
    ],
    photos: [
      { id: "p1", seed: "sniadwy-g1", author: "Marek_Wedkarz", date: "15 mar 2026", caption: "Wschód słońca nad Śniardwami" },
      { id: "p2", seed: "sniadwy-g2", author: "PiotrFromPoznan", date: "10 mar 2026", caption: "Połów z łódki" },
      { id: "p3", seed: "sniadwy-g3", author: "ZimowySpin", date: "8 mar 2026", caption: "Zatoka przy wyspie" },
      { id: "p4", seed: "sniadwy-g4", author: "KingaW", date: "1 mar 2026", caption: "Piękny sandacz" },
    ],
  },
  {
    id: "biebrza",
    name: "Rzeka Biebrza",
    type: "dzikie",
    lat: 53.465,
    lng: 22.701,
    voivodeship: "Podlaskie",
    description:
      "Dzika rzeka w sercu Biebrzańskiego Parku Narodowego. Raj dla spinningistów i wędkarzy muchowych. Biebrza słynie z ogromnych szczupaków i okoni bytujących wśród trzcin. Wędkowanie możliwe wyłącznie na wyznaczonych odcinkach, obowiązuje zezwolenie na wędkowanie w parku.",
    coverSeed: "biebrza-cover",
    rating: 4.9,
    reviewCount: 87,
    lastActivity: "30 min temu",
    fishSpecies: ["szczupak", "okoń", "lin", "karaś", "płoć"],
    reviews: [
      {
        id: "r1",
        author: "SpinFan_PL",
        avatarSeed: "spin",
        rating: 5,
        comment: "Absolutnie dzikie miejsce. Szczupaki w tym roku rekordowe. Polecam maj i wrzesień.",
        date: "14 mar 2026",
      },
      {
        id: "r2",
        author: "MuchowyMarcin",
        avatarSeed: "marcin",
        rating: 5,
        comment: "Najlepsze miejsce na muchówkę w Polsce! Trout i szczupaki biorą na suche muchy rano.",
        date: "7 mar 2026",
      },
    ],
    tips: [
      {
        id: "t1",
        author: "SpinFan_PL",
        icon: "🦟",
        text: "Zabrać repelent na komary – to poważna sprawa szczególnie w maju i czerwcu.",
        date: "14 mar 2026",
      },
      {
        id: "t2",
        author: "MuchowyMarcin",
        icon: "🚶",
        text: "Dojście do rzeki może być błotniste – wysokie wodery obowiązkowe przez cały sezon.",
        date: "7 mar 2026",
      },
      {
        id: "t3",
        author: "WildFishing",
        icon: "🌅",
        text: "Najlepsze brania świt i zmierzch. Szczupaki aktywne przy trzcinach, jig 14g na głębinach.",
        date: "3 mar 2026",
      },
    ],
    fishEntries: [
      { id: "f1", species: "Szczupak", author: "SpinFan_PL", weight: "5.8 kg", photoSeed: "biebrza-f1", date: "14 mar 2026", count: 34 },
      { id: "f2", species: "Okoń", author: "MuchowyMarcin", weight: "0.4 kg", photoSeed: "biebrza-f2", date: "7 mar 2026", count: 22 },
    ],
    photos: [
      { id: "p1", seed: "biebrza-g1", author: "SpinFan_PL", date: "14 mar 2026", caption: "Brzeg Biebrzy o świcie" },
      { id: "p2", seed: "biebrza-g2", author: "MuchowyMarcin", date: "7 mar 2026", caption: "Nymfowanie w nurcie" },
      { id: "p3", seed: "biebrza-g3", author: "WildFishing", date: "3 mar 2026", caption: "Dzikie tereny parku" },
    ],
  },
  {
    id: "zegrze",
    name: "Zalew Zegrzyński",
    type: "pzw",
    lat: 52.482,
    lng: 21.065,
    voivodeship: "Mazowieckie",
    description:
      "Zbiornik retencyjny niedaleko Warszawy – ulubione miejsce stołecznych wędkarzy. Powierzchnia ok. 33 km². Znany z dużych leszczów, okoni i szczupaków. Dobra infrastruktura brzegowa, dużo pomostów i łatwy dojazd z Warszawy. Połowy na podstawie karty wędkarskiej PZW.",
    coverSeed: "zegrze-cover",
    rating: 4.2,
    reviewCount: 234,
    lastActivity: "1 godz. temu",
    fishSpecies: ["leszcz", "okoń", "szczupak", "karp", "wzdręga", "płoć"],
    reviews: [
      {
        id: "r1",
        author: "Warszawiak1990",
        avatarSeed: "warsz",
        rating: 4,
        comment: "Doskonałe miejsce na feeder. Leszcze biorą prawie całą dobę. Przy Serocku są dobre łowiska.",
        date: "12 mar 2026",
      },
      {
        id: "r2",
        author: "AnnaFly",
        avatarSeed: "anna",
        rating: 3,
        comment: "Spory tłok w weekendy, ale miejsca i tak starczy. Infrastruktura dobra, toalety przy parkingach.",
        date: "6 mar 2026",
      },
      {
        id: "r3",
        author: "KubaTrojka",
        avatarSeed: "kuba",
        rating: 5,
        comment: "Rekordowy leszcz 2.3 kg przy pomoście w Nieporęcie! Zanęta Sensas i robak – nie zawodzi.",
        date: "28 lut 2026",
      },
    ],
    tips: [
      { id: "t1", author: "Warszawiak1990", icon: "🅿️", text: "Parking przy plaży w Nieporęcie – bezpłatny, pojemny, dobre wejście do wody.", date: "12 mar 2026" },
      { id: "t2", author: "KubaTrojka", icon: "🪱", text: "Robak biały na feeder – nie zawodzi przy leszczach. Zanęta słodka, nie za dużo.", date: "28 lut 2026" },
      { id: "t3", author: "Presja2024", icon: "⚠️", text: "W weekendy presja wędkarska bardzo duża, szczególnie przy Serocku. Lepiej w tygodniu.", date: "20 lut 2026" },
    ],
    fishEntries: [
      { id: "f1", species: "Leszcz", author: "KubaTrojka", weight: "2.3 kg", photoSeed: "zegrze-f1", date: "28 lut 2026", count: 67 },
      { id: "f2", species: "Okoń", author: "AnnaFly", weight: "0.5 kg", photoSeed: "zegrze-f2", date: "6 mar 2026", count: 45 },
      { id: "f3", species: "Szczupak", author: "Warszawiak1990", weight: "3.1 kg", photoSeed: "zegrze-f3", date: "12 mar 2026", count: 28 },
    ],
    photos: [
      { id: "p1", seed: "zegrze-g1", author: "Warszawiak1990", date: "12 mar 2026", caption: "Pomost w Nieporęcie" },
      { id: "p2", seed: "zegrze-g2", author: "KubaTrojka", date: "28 lut 2026", caption: "Leszcz 2.3 kg!" },
      { id: "p3", seed: "zegrze-g3", author: "AnnaFly", date: "6 mar 2026", caption: "Zachód słońca nad Zalewem" },
    ],
  },
  {
    id: "drawsko",
    name: "Jezioro Drawsko",
    type: "pzw",
    lat: 53.619,
    lng: 15.83,
    voivodeship: "Zachodniopomorskie",
    description:
      "Drugie co do głębokości jezioro w Polsce (max 80 m). Drawsko słynie z ogromnych węgorzy, sielaw i troć. Czysta, zimna woda sprzyja rybom drapieżnym. Akwen zarybiony, doskonała baza noclegowa w okolicach Czaplinka. Polecany turystom wędkarskim z całej Polski.",
    coverSeed: "drawsko-cover",
    rating: 4.6,
    reviewCount: 98,
    lastActivity: "3 godz. temu",
    fishSpecies: ["węgorz", "sieja", "sielawa", "szczupak", "okoń", "sandacz"],
    reviews: [
      {
        id: "r1",
        author: "NightFisher_PL",
        avatarSeed: "night",
        rating: 5,
        comment: "Najlepsze węgorze jakie łowiłem. Z łódki na robaka przy dnie. Woda krystalicznie czysta.",
        date: "11 mar 2026",
      },
      {
        id: "r2",
        author: "TroikaTomek",
        avatarSeed: "tomek",
        rating: 4,
        comment: "Sandacze na głębokich miejscach absolutne potwory. Warto zainwestować w echosonifier.",
        date: "4 mar 2026",
      },
    ],
    tips: [
      { id: "t1", author: "NightFisher_PL", icon: "🌙", text: "Węgorz nocą przy dnie, robak lub martwa rybka. Głębokości 5-10m najlepsze.", date: "11 mar 2026" },
      { id: "t2", author: "TroikaTomek", icon: "📡", text: "Echosonda obowiązkowa – jezioro jest bardzo głębokie, ryby trzymają się struktury dna.", date: "4 mar 2026" },
    ],
    fishEntries: [
      { id: "f1", species: "Węgorz", author: "NightFisher_PL", weight: "1.8 kg", photoSeed: "drawsko-f1", date: "11 mar 2026", count: 16 },
      { id: "f2", species: "Sandacz", author: "TroikaTomek", weight: "3.4 kg", photoSeed: "drawsko-f2", date: "4 mar 2026", count: 11 },
    ],
    photos: [
      { id: "p1", seed: "drawsko-g1", author: "NightFisher_PL", date: "11 mar 2026", caption: "Połów nocny" },
      { id: "p2", seed: "drawsko-g2", author: "TroikaTomek", date: "4 mar 2026", caption: "Widok z zachodu" },
    ],
  },
  {
    id: "goplo",
    name: "Jezioro Gopło",
    type: "pzw",
    lat: 52.567,
    lng: 18.34,
    voivodeship: "Kujawsko-Pomorskie",
    description:
      "Historyczne jezioro w sercu Kujaw, związane z legendą o Popielu i Piastach. Powierzchnia ok. 21 km². Znany z bogatych połowów karpia, lina i leszcza. Akwen PZW z dobrze rozwiniętą infrastrukturą wędkarską. Okolice jeziora objęte są parkiem krajobrazowym.",
    coverSeed: "goplo-cover",
    rating: 4.3,
    reviewCount: 76,
    lastActivity: "5 godz. temu",
    fishSpecies: ["karp", "lin", "leszcz", "szczupak", "karaś"],
    reviews: [
      {
        id: "r1",
        author: "KarpMistrz",
        avatarSeed: "karp",
        rating: 5,
        comment: "Karpie w Gople to fenomen! Złowiłem 12 kg karpia na boilie cynamonowe. Nocka przy rezerwacie.",
        date: "9 mar 2026",
      },
    ],
    tips: [
      { id: "t1", author: "KarpMistrz", icon: "🎯", text: "Boilie cynamonowe lub truskawkowe, głębokość 1.5-2.5m w zatoce od strony Kruszwicy.", date: "9 mar 2026" },
      { id: "t2", author: "LinLover", icon: "🌿", text: "Liny trzymają się trzcin. Spławik z robakiem, rano i wieczorem.", date: "3 mar 2026" },
    ],
    fishEntries: [
      { id: "f1", species: "Karp", author: "KarpMistrz", weight: "12.0 kg", photoSeed: "goplo-f1", date: "9 mar 2026", count: 23 },
      { id: "f2", species: "Lin", author: "LinLover", weight: "0.9 kg", photoSeed: "goplo-f2", date: "3 mar 2026", count: 18 },
    ],
    photos: [
      { id: "p1", seed: "goplo-g1", author: "KarpMistrz", date: "9 mar 2026", caption: "Karp 12 kg!" },
      { id: "p2", seed: "goplo-g2", author: "LinLover", date: "3 mar 2026", caption: "Wschód nad Gopłem" },
    ],
  },
  {
    id: "staw-krakow",
    name: "Łowisko Pod Lipami",
    type: "komercyjne",
    lat: 50.123,
    lng: 19.982,
    voivodeship: "Małopolskie",
    description:
      "Prywatne, komercyjne łowisko w okolicach Krakowa. Starannie utrzymane, regularnie zarybiane karpiem królewskim i pstrągiem tęczowym. Możliwość połowu bez karty wędkarskiej. W cenie wędkowania: domek nad stawem, grill, toaleta, bezpłatny parking. Rezerwacje przez telefon.",
    coverSeed: "krakow-cover",
    rating: 4.8,
    reviewCount: 189,
    lastActivity: "45 min temu",
    fishSpecies: ["karp", "pstrąg tęczowy", "amur", "tołpyga", "karaś"],
    reviews: [
      {
        id: "r1",
        author: "Krakusek2025",
        avatarSeed: "krakus",
        rating: 5,
        comment: "Idealne na rodzinny dzień. Dzieci złowiły 3 karpie! Obsługa super, domek czysty. Zdecydowanie polecam.",
        date: "13 mar 2026",
      },
      {
        id: "r2",
        author: "PstrągLover",
        avatarSeed: "pstrag",
        rating: 5,
        comment: "Pstrągi na Mepps nr 3 – brały jedna za drugą. Zarybienie regularne, właściciel godny polecenia.",
        date: "5 mar 2026",
      },
      {
        id: "r3",
        author: "FamilyFish",
        avatarSeed: "family",
        rating: 4,
        comment: "Cena 60 zł za dobę połowu – trochę drogo, ale warto za spokój i komfort.",
        date: "27 lut 2026",
      },
    ],
    tips: [
      { id: "t1", author: "Krakusek2025", icon: "👨‍👩‍👧", text: "Idealne dla rodzin z dziećmi. Małe karpie i karasy na każdym stanowisku.", date: "13 mar 2026" },
      { id: "t2", author: "PstrągLover", icon: "🎣", text: "Pstrąg bierze na Mepps 3 złoty. Nie przesadzaj z zanętą – zarybienie jest tu naprawdę dobre.", date: "5 mar 2026" },
      { id: "t3", author: "KomercjaExpert", icon: "💰", text: "Warto zadzwonić dzień wcześniej i zapytać o ostatnie zarybienie – czasem można dostać info o świeżym karpiu.", date: "1 mar 2026" },
    ],
    fishEntries: [
      { id: "f1", species: "Karp królewskij", author: "Krakusek2025", weight: "3.5 kg", photoSeed: "krakow-f1", date: "13 mar 2026", count: 89 },
      { id: "f2", species: "Pstrąg tęczowy", author: "PstrągLover", weight: "1.2 kg", photoSeed: "krakow-f2", date: "5 mar 2026", count: 54 },
      { id: "f3", species: "Amur", author: "FamilyFish", weight: "4.8 kg", photoSeed: "krakow-f3", date: "27 lut 2026", count: 17 },
    ],
    photos: [
      { id: "p1", seed: "krakow-g1", author: "Krakusek2025", date: "13 mar 2026", caption: "Staw o poranku" },
      { id: "p2", seed: "krakow-g2", author: "PstrągLover", date: "5 mar 2026", caption: "Pstrąg na Mepps" },
      { id: "p3", seed: "krakow-g3", author: "FamilyFish", date: "27 lut 2026", caption: "Domek nad stawem" },
      { id: "p4", seed: "krakow-g4", author: "KomercjaExpert", date: "1 mar 2026", caption: "Zachód nad łowiskiem" },
    ],
  },
  {
    id: "san",
    name: "Rzeka San – Bieszczady",
    type: "dzikie",
    lat: 49.874,
    lng: 22.643,
    voivodeship: "Podkarpackie",
    description:
      "Dzika i malownicza rzeka płynąca przez Bieszczady. San to jedna z ostatnich dzikich rzek nizinno-górskich w Polsce. Dostępna wyłącznie pieszo przez las. Wędkarstwo wyjątkowe – pstrągi, lipy i klenie w krystalicznie czystej wodzie. Obowiązują ścisłe limity i wymiary ochronne.",
    coverSeed: "san-cover",
    rating: 4.8,
    reviewCount: 64,
    lastActivity: "Wczoraj",
    fishSpecies: ["pstrąg potokowy", "lipień", "kleń", "brzana", "świnka"],
    reviews: [
      {
        id: "r1",
        author: "MuchowyKról",
        avatarSeed: "mucha",
        rating: 5,
        comment: "Najpiękniejsza rzeka w Polsce. Lipień na suchą muchę – to jest dopiero wędkarstwo! CnR, każda rybka wraca do wody.",
        date: "10 mar 2026",
      },
      {
        id: "r2",
        author: "BieszczadyFan",
        avatarSeed: "bieszcz",
        rating: 5,
        comment: "Widoki zapierają dech. Dotarcie zajmuje 2 godziny marszu, ale warto każdej minuty.",
        date: "2 mar 2026",
      },
    ],
    tips: [
      { id: "t1", author: "MuchowyKról", icon: "🪰", text: "Suche muchy majówki i jętki. Lipień reaguje tylko na naturalne wzorce. Żaden jig nie zastąpi muchy.", date: "10 mar 2026" },
      { id: "t2", author: "BieszczadyFan", icon: "🥾", text: "Obowiązkowe wysokie buty trekkingowe. Droga do rzeki jest błotnista przez cały rok.", date: "2 mar 2026" },
      { id: "t3", author: "EkoWedkarz", icon: "♻️", text: "CnR obowiązkowe! Piękne miejsce – dbajcie o nie dla następnych pokoleń.", date: "25 lut 2026" },
    ],
    fishEntries: [
      { id: "f1", species: "Lipień", author: "MuchowyKról", weight: "0.7 kg", photoSeed: "san-f1", date: "10 mar 2026", count: 12 },
      { id: "f2", species: "Pstrąg potokowy", author: "BieszczadyFan", weight: "0.4 kg", photoSeed: "san-f2", date: "2 mar 2026", count: 9 },
    ],
    photos: [
      { id: "p1", seed: "san-g1", author: "MuchowyKról", date: "10 mar 2026", caption: "San w zimowym ujęciu" },
      { id: "p2", seed: "san-g2", author: "BieszczadyFan", date: "2 mar 2026", caption: "Górski nurt Sanu" },
      { id: "p3", seed: "san-g3", author: "EkoWedkarz", date: "25 lut 2026", caption: "Przejrzysta woda" },
    ],
  },
  {
    id: "hancza",
    name: "Jezioro Hańcza",
    type: "dzikie",
    lat: 54.25,
    lng: 22.945,
    voivodeship: "Podlaskie",
    description:
      "Najgłębsze jezioro w Polsce (108.5 m) i w całej Europie Środkowej poza Alpami. Woda o wyjątkowej przejrzystości i czystości. Zimna woda – idealne środowisko dla sieja i sielawy. Jezioro leży w Wigierskim Parku Narodowym – obowiązkowe zezwolenie parkowe.",
    coverSeed: "hancza-cover",
    rating: 4.9,
    reviewCount: 51,
    lastActivity: "Wczoraj",
    fishSpecies: ["sieja", "sielawa", "troć", "szczupak", "okoń"],
    reviews: [
      {
        id: "r1",
        author: "GłębinaDiver",
        avatarSeed: "diver",
        rating: 5,
        comment: "Niebywałe jezioro. Woda przejrzysta na kilkanaście metrów, widać ryby. Sieje na trolling z łódki – przeżycie!",
        date: "8 mar 2026",
      },
    ],
    tips: [
      { id: "t1", author: "GłębinaDiver", icon: "⛵", text: "Sieje wyłącznie z łódki, minimum 15 m głębokości. Trolling z małym woblerem 5-7 cm.", date: "8 mar 2026" },
      { id: "t2", author: "ParkRanger", icon: "📜", text: "Koniecznie kupić zezwolenie parkowe w wejściu do WPN. Kontrole są regularne.", date: "1 mar 2026" },
    ],
    fishEntries: [
      { id: "f1", species: "Sieja", author: "GłębinaDiver", weight: "1.1 kg", photoSeed: "hancza-f1", date: "8 mar 2026", count: 7 },
    ],
    photos: [
      { id: "p1", seed: "hancza-g1", author: "GłębinaDiver", date: "8 mar 2026", caption: "Kryształowa woda Hańczy" },
      { id: "p2", seed: "hancza-g2", author: "ParkRanger", date: "1 mar 2026", caption: "Widok z brzegu" },
    ],
  },
];

export const TYPE_CONFIG: Record<SpotType, { label: string; color: string; bg: string; border: string }> = {
  pzw: {
    label: "PZW",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.4)",
  },
  dzikie: {
    label: "Dzikie",
    color: "#00ce00",
    bg: "rgba(0,206,0,0.12)",
    border: "rgba(0,206,0,0.35)",
  },
  komercyjne: {
    label: "Komercyjne",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.4)",
  },
};
