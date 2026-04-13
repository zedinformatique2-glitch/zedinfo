import type { Locale } from "./i18n/config";

export function formatDzd(amount: number, locale: Locale = "fr"): string {
  const lang = locale === "ar" ? "ar-DZ" : locale === "en" ? "en-DZ" : "fr-DZ";
  try {
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "DZD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(lang)} DZD`;
  }
}

export function formatDate(ts: number, locale: Locale = "fr"): string {
  const lang = locale === "ar" ? "ar-DZ" : locale === "en" ? "en-DZ" : "fr-DZ";
  return new Intl.DateTimeFormat(lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(ts));
}

export function formatDateTime(ts: number, locale: Locale = "fr"): string {
  const lang = locale === "ar" ? "ar-DZ" : locale === "en" ? "en-DZ" : "fr-DZ";
  return new Intl.DateTimeFormat(lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function localizedName<T extends { nameFr: string; nameAr: string }>(
  item: T,
  locale: Locale
): string {
  return locale === "ar" ? item.nameAr : item.nameFr; // en falls back to French
}

export function localizedDesc<T extends { descFr: string; descAr: string }>(
  item: T,
  locale: Locale
): string {
  return locale === "ar" ? item.descAr : item.descFr;
}
