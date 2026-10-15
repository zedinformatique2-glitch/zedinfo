// Orders per view for a landing page, as a percentage with one decimal.
// Null when there are no views yet (nothing to measure).
export function conversionRate(orders: number, views: number): number | null {
  if (views <= 0) return null;
  const pct = Math.round((orders / views) * 1000) / 10;
  return Math.min(100, pct);
}

// The editor writes one text and copies it into FR and AR, so a language
// switcher would only change the small labels. Show it only when a page really
// has different French and Arabic text (e.g. pages written before Oct 2026).
const TEXT_KEYS = ["headline", "subheadline", "cta", "description", "urgencyText", "guaranteeText", "scarcityText"];

export function hasSeparateLanguages(page: Record<string, any>): boolean {
  const differs = (fr: unknown, ar: unknown) => !!fr && !!ar && JSON.stringify(fr) !== JSON.stringify(ar);
  if (TEXT_KEYS.some((k) => differs(page[`${k}Fr`], page[`${k}Ar`]))) return true;
  const bFr = page.bulletsFr, bAr = page.bulletsAr;
  return Array.isArray(bFr) && Array.isArray(bAr) && bFr.length > 0 && bAr.length > 0 && differs(bFr, bAr);
}
