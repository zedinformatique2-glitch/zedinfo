/**
 * Push out-of-stock products to the end of a list, preserving the caller's
 * existing order within each group (Array.prototype.sort is stable).
 * Apply as the LAST pass, after any price/date sort.
 */
export function sortOutOfStockLast<T extends { stock: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
}
