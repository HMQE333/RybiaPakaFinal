export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rybiapaka.pl";
export const SITE_NAME = "RybiaPaka.pl - Zintegrowana Platforma Wędkarska";
export const SITE_ALTERNATE_NAME = "RybiaPaka";
export const SITE_DESCRIPTION =
  "Dołącz do społeczności wędkarzy: aktywne forum, galeria połowów, porady i dyskusje o sprzęcie, wodach i metodach.";
export const SITE_LOGO_PATH = "/logo.png";
export const SITE_OG_IMAGE_PATH = "/icons/zdjecietest.webp";

export const toAbsoluteUrl = (path: string) => new URL(path, SITE_URL).toString();
