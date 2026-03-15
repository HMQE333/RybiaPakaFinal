function pluralize(
  count: number,
  singular: string,
  few: string,
  many: string
) {
  const abs = Math.abs(count);
  const last = abs % 10;
  const lastTwo = abs % 100;

  if (abs === 1) return singular;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
    return few;
  }
  return many;
}

export function formatTimeAgo(isoDate: string) {
  const timestamp = Date.parse(isoDate);
  if (!Number.isFinite(timestamp)) return "";

  const diffMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Przed chwilą";
  if (minutes < 60) {
    return `${minutes} ${pluralize(minutes, "minuta", "minuty", "minut")} temu`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${pluralize(hours, "godzina", "godziny", "godzin")} temu`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} ${pluralize(days, "dzień", "dni", "dni")} temu`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `${weeks} ${pluralize(
      weeks,
      "tydzień",
      "tygodnie",
      "tygodni"
    )} temu`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ${pluralize(
      months,
      "miesiąc",
      "miesiące",
      "miesięcy"
    )} temu`;
  }

  const years = Math.floor(days / 365);
  return `${years} ${pluralize(years, "rok", "lata", "lat")} temu`;
}
