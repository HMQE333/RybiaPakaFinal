export const forumUrls = {
  discord: "https://discord.com/invite/QV5y9ZC49X",
  website: "https://bio.link/rybiapaka",
  tipply: "https://tipply.pl/@rybiapaka",
} as const;

export const voivodeshipLabels = {
  Dolnoslaskie: "Dolnośląskie",
  "Kujawsko-Pomorskie": "Kujawsko-Pomorskie",
  Lubelskie: "Lubelskie",
  Lubuskie: "Lubuskie",
  Lodzkie: "Łódzkie",
  Malopolskie: "Małopolskie",
  Mazowieckie: "Mazowieckie",
  Opolskie: "Opolskie",
  Podkarpackie: "Podkarpackie",
  Podlaskie: "Podlaskie",
  Pomorskie: "Pomorskie",
  Slaskie: "Śląskie",
  Swietokrzyskie: "Świętokrzyskie",
  "Warminsko-Mazurskie": "Warmińsko-Mazurskie",
  Wielkopolskie: "Wielkopolskie",
  Zachodniopomorskie: "Zachodniopomorskie",
  Zagranica: "Zagranica",
} as const;

export const voivodeshipKeys = Object.keys(voivodeshipLabels);
export const voivodeships = Object.values(voivodeshipLabels);

export const getVoivodeshipLabel = (name?: string | null) => {
  if (!name) return null;
  return (
    voivodeshipLabels[name as keyof typeof voivodeshipLabels] ?? name
  );
};

export const fishingMethods = [
  "spinning",
  "mucha",
  "trolling",
  "sumowe",
  "morskie",
  "casting",
  "splawik",
  "feeder",
  "metoda",
  "karpiarstwo",
  "podlodowe",
];
