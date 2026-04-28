import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://www.zed-informatique.com"
  );
}

/**
 * Build metadata.alternates for a localized path.
 *
 * @param locale  current locale of the page being rendered
 * @param path    path without locale prefix and without trailing slash, e.g. "" or "/shop" or "/product/foo"
 */
export function buildAlternates(locale: Locale, path: string) {
  const base = siteUrl();
  const normalized = path.startsWith("/") || path === "" ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${base}/${l}${normalized}`;
  }
  languages["x-default"] = `${base}/${defaultLocale}${normalized}`;
  return {
    canonical: `${base}/${locale}${normalized}`,
    languages,
  };
}
