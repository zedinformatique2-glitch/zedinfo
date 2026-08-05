"use client";

import { useEffect, useRef } from "react";
import { fbTrack, FB_CURRENCY } from "@/lib/fb-pixel";

/**
 * Fires a Meta `ViewContent` once on mount. Rendered from the (server) product
 * and prebuilt detail pages.
 */
export function TrackViewContent({
  id,
  name,
  value,
}: {
  id: string;
  name: string;
  value: number;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fbTrack("ViewContent", {
      content_ids: [id],
      content_name: name,
      content_type: "product",
      value,
      currency: FB_CURRENCY,
    });
  }, [id, name, value]);

  return null;
}
