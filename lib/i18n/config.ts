export const locales = ["ar", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export const localeLabels: Record<Locale, string> = {
  fr: "Français",
  ar: "العربية",
};

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}
