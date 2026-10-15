"use client";

import { useEffect, useState } from "react";
import { LandingPageClient } from "../lp/[slug]/LandingPageClient";

// Renders whatever the admin form posts to it. It fetches nothing itself and
// only accepts messages from this same site.
export default function LandingPreviewPage() {
  const [page, setPage] = useState<any>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "lp-preview") setPage(e.data.page);
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "lp-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!page) return null;
  // Re-mount when the default language changes so the preview starts in it.
  return <LandingPageClient key={page.defaultLang} page={page} preview />;
}
