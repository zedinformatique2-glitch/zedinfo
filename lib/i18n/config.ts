export const locales = ["ar", "fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export const localeLabels: Record<Locale, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
};

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}
