"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart, cartItemKey, type CartItem } from "@/lib/cart-store";

/**
 * Cart lines that can't be ordered because their product is flagged
 * `requiresBuild` (sold only inside a full PC build).
 *
 * Lines added by the configurator carry `fromBuild` and are always allowed —
 * that IS the full build. Everything else is checked against the server,
 * because the cart lives in localStorage and can outlive a flag change.
 *
 * `loading` is true until the check has resolved, so callers can hold the
 * submit button rather than briefly letting a blocked cart through.
 */
export function useRequiresBuildBlock(): {
  blockedItems: CartItem[];
  blocked: boolean;
  loading: boolean;
  removeBlocked: () => void;
} {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);

  const candidates = items.filter((i) => !i.fromBuild);
  const blockedSlugs = useQuery(
    api.products.requiresBuildSlugs,
    candidates.length > 0 ? { slugs: candidates.map((i) => i.slug) } : "skip"
  );

  const blockedItems =
    blockedSlugs === undefined
      ? []
      : candidates.filter((i) => blockedSlugs.includes(i.slug));

  return {
    blockedItems,
    blocked: blockedItems.length > 0,
    loading: candidates.length > 0 && blockedSlugs === undefined,
    removeBlocked: () => {
      for (const item of blockedItems) remove(cartItemKey(item));
    },
  };
}
