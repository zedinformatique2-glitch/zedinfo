/**
 * Meta (Facebook) Pixel helpers.
 *
 * Every fbq() call in the app goes through `fbTrack` so a blocked pixel, an
 * ad-blocker, or a slow fbevents.js can never throw inside a checkout handler.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export const FB_CURRENCY = "DZD";

/** Fire a Meta standard event. Silently no-ops when the pixel isn't available. */
export function fbTrack(
  event: string,
  params?: Record<string, unknown>,
  eventID?: string,
): void {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    if (eventID) {
      window.fbq("track", event, params ?? {}, { eventID });
    } else {
      window.fbq("track", event, params ?? {});
    }
  } catch {
    /* tracking must never break the page */
  }
}

export type FbLineItem = {
  slug: string;
  priceDzd: number;
  qty: number;
};

/** Map cart-shaped line items to Meta's contents / content_ids params. */
export function fbContents(items: FbLineItem[]) {
  return {
    content_type: "product",
    content_ids: items.map((i) => i.slug),
    contents: items.map((i) => ({
      id: i.slug,
      quantity: i.qty,
      item_price: i.priceDzd,
    })),
    num_items: items.reduce((n, i) => n + i.qty, 0),
  };
}
