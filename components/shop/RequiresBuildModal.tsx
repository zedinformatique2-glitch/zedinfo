"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/lib/i18n/routing";
import { Icon } from "@/components/ui/Icon";

export function RequiresBuildModal({
  open,
  onClose,
  title,
  body,
  contactCta,
  configureCta,
  closeLabel,
  whatsappUrl,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  contactCta: string;
  configureCta: string;
  closeLabel: string;
  whatsappUrl: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="requires-build-title"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-card ring-1 ring-outline-variant/40 p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute top-3 end-3 w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition"
        >
          <Icon name="close" className="text-[20px]" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <span className="shrink-0 w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Icon name="build" className="text-[22px]" />
          </span>
          <h2
            id="requires-build-title"
            className="text-lg sm:text-xl font-black tracking-tight text-on-surface mt-1"
          >
            {title}
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-on-surface-variant whitespace-pre-line">
          {body}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm hover:bg-emerald-600 transition"
          >
            <Icon name="chat" className="text-sm" />
            <span>{contactCta}</span>
          </a>
          <Link
            href="/configurator"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm hover:brightness-110 transition"
          >
            <Icon name="memory" className="text-sm" />
            <span>{configureCta}</span>
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
