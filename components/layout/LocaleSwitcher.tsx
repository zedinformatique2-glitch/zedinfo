"use client";

import { usePathname, useRouter } from "@/lib/i18n/routing";
import { type Locale, locales, localeLabels } from "@/lib/i18n/config";
import { useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const current = (params.locale as Locale) ?? "fr";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const shortLabel: Record<Locale, string> = {
    fr: "FR",
    ar: "عربي",
    en: "EN",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg text-sm font-bold text-primary hover:bg-gray-100 transition-colors"
      >
        {shortLabel[current]}
      </button>
      {open && (
        <div className="absolute end-0 top-full mt-1 bg-white rounded-xl shadow-card ring-1 ring-outline-variant/40 overflow-hidden z-50 min-w-[120px]">
          {locales
            .filter((l) => l !== current)
            .map((locale) => (
              <button
                key={locale}
                onClick={() => {
                  router.replace(pathname, { locale });
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-sm text-start hover:bg-gray-50 transition-colors"
              >
                {localeLabels[locale]}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
