"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { fbTrack } from "@/lib/fb-pixel";

/**
 * Next.js navigates client-side, so the inline pixel snippet only ever fires one
 * PageView per session. This re-fires it on every route change. The first run is
 * skipped — the init snippet already sent that one.
 */
export function PixelPageView() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    fbTrack("PageView");
  }, [pathname]);

  return null;
}
