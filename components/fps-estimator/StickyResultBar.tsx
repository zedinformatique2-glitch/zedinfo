"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Phone-only bar pinned to the bottom of the screen while the result panel is
 * below the viewport, so people can keep changing inputs and jump to the result.
 */
export function StickyResultBar({
  targetId,
  cta,
  children,
}: {
  targetId: string;
  cta: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setShow(!entry.isIntersecting && entry.boundingClientRect.top > 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <div
      className={`lg:hidden fixed bottom-4 left-4 right-24 z-40 transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
        className="w-full flex items-center gap-3 rounded-2xl bg-slate-900/95 backdrop-blur ring-1 ring-white/15 shadow-2xl px-4 py-3 text-start"
      >
        <span className="flex-1 min-w-0">{children}</span>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-white">
          {cta}
          <Icon name="arrow_downward" className="text-[16px]" />
        </span>
      </button>
    </div>
  );
}
