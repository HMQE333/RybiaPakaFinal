export const PRESET_BANNERS = [
  {
    id: "gleboka-woda",
    label: "Głęboka woda",
    gradient: "linear-gradient(135deg, #001a3a 0%, #003a7a 50%, #0055aa 100%)",
  },
  {
    id: "zielony-las",
    label: "Zielony las",
    gradient: "linear-gradient(135deg, #002200 0%, #004d00 50%, #007a00 100%)",
  },
  {
    id: "zachod-slonca",
    label: "Zachód słońca",
    gradient: "linear-gradient(135deg, #4a0800 0%, #aa2200 40%, #ff6600 100%)",
  },
  {
    id: "mgla-poranna",
    label: "Mgła poranna",
    gradient: "linear-gradient(135deg, #0d0d1a 0%, #1a2040 50%, #2d3a6e 100%)",
  },
  {
    id: "torfowisko",
    label: "Torfowisko",
    gradient: "linear-gradient(135deg, #1a0d00 0%, #3d2a00 50%, #5c4020 100%)",
  },
  {
    id: "rzeka",
    label: "Rzeka",
    gradient: "linear-gradient(135deg, #001a1a 0%, #004d50 50%, #007a7d 100%)",
  },
] as const;

export type PresetBannerId = (typeof PRESET_BANNERS)[number]["id"];

export const PRESET_BANNER_GRADIENTS: Record<string, string> = Object.fromEntries(
  PRESET_BANNERS.map((b) => [b.id, b.gradient])
);

export function resolveBannerStyle(bannerUrl: string | null | undefined): {
  type: "preset" | "image" | "none";
  gradient?: string;
  src?: string;
} {
  if (!bannerUrl) return { type: "none" };
  if (bannerUrl.startsWith("preset:")) {
    const id = bannerUrl.slice("preset:".length);
    const gradient = PRESET_BANNER_GRADIENTS[id];
    if (gradient) return { type: "preset", gradient };
    return { type: "none" };
  }
  return { type: "image", src: bannerUrl };
}

export const AGE_RANGES = [
  { value: "do 18", label: "do 18 lat" },
  { value: "18–25", label: "18–25 lat" },
  { value: "26–35", label: "26–35 lat" },
  { value: "36–45", label: "36–45 lat" },
  { value: "46–55", label: "46–55 lat" },
  { value: "56+", label: "56 lat i więcej" },
] as const;
