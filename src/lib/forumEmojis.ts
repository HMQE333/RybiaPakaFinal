export type PlatformEmoji = {
  id: string;
  label: string;
  src: string;
  title: string;
};

export const PLATFORM_EMOJIS: PlatformEmoji[] = [
  { id: "karp",    label: "Karp!",    src: "/emojis/karp.svg",    title: "Karp! — świetne złowisko" },
  { id: "ogien",   label: "Gorące!",  src: "/emojis/ogien.svg",   title: "Gorący temat!" },
  { id: "rekord",  label: "Rekord!",  src: "/emojis/rekord.svg",  title: "To rekord!" },
  { id: "wedka",   label: "Dobra rada", src: "/emojis/wedka.svg", title: "Dobra rada wędkarska" },
  { id: "spławik", label: "Biorę!",   src: "/emojis/spławik.svg", title: "Biorę! — interesujące" },
  { id: "haczyk",  label: "Zahaczony!", src: "/emojis/haczyk.svg", title: "Zahaczony!" },
];

export const EMOJI_BY_ID = new Map(PLATFORM_EMOJIS.map((e) => [e.id, e]));

export const VALID_EMOJI_IDS = new Set(PLATFORM_EMOJIS.map((e) => e.id));
