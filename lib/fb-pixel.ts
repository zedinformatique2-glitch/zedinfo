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

/**
 * Identical events fired inside this window are treated as an accidental repeat.
 * Matches the 2s window Meta Pixel Helper uses to flag duplicates, so anything
 * it would complain about is collapsed before it is sent.
 */
const DEDUPE_MS = 2000;
const lastFired = new Map<string, number>();

function randomEventId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${rand}`;
}

/**
 * Fire a Meta standard event. Silently no-ops when the pixel isn't available.
 *
 * Every event carries an eventID. Meta dedupes on (event_name, event_id), so if
 * the pixel ends up initialised twice for the same ID — e.g. a second Meta tag
 * inside the GTM container — the duplicate send collapses into one event.
 *
 * Separately, an identical event within DEDUPE_MS is dropped client-side. That
 * catches a double click or a handler firing twice, which the eventID cannot
 * fix because each call would otherwise mint its own ID.
 */
export function fbTrack(
  event: string,
  params?: Record<string, unknown>,
  eventID?: string,
): void {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    // PageView is exempt: two navigations in quick succession are legitimate,
    // and an under-counted PageView is worse than a duplicated one.
    if (event !== "PageView") {
      const key = `${event}:${JSON.stringify(params ?? {})}`;
      const now = Date.now();
      const previous = lastFired.get(key);
      if (previous !== undefined && now - previous < DEDUPE_MS) return;
      lastFired.set(key, now);
    }

    window.fbq("track", event, params ?? {}, {
      eventID: eventID ?? randomEventId(event),
    });
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
