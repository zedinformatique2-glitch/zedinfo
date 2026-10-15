// Orders per view for a landing page, as a percentage with one decimal.
// Null when there are no views yet (nothing to measure).
export function conversionRate(orders: number, views: number): number | null {
  if (views <= 0) return null;
  const pct = Math.round((orders / views) * 1000) / 10;
  return Math.min(100, pct);
}
