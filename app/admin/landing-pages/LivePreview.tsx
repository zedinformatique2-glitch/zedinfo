"use client";

import { useEffect, useRef, useState } from "react";

// Live preview of the landing page being edited. The page renders inside an
// iframe (/lp-preview) at a real phone or desktop width, so the layout is the
// one visitors get, then is scaled down to fit the panel.
const DEVICES = {
  mobile: { w: 390, h: 780, label: "هاتف", icon: "smartphone" },
  desktop: { w: 1280, h: 800, label: "حاسوب", icon: "desktop_windows" },
} as const;
type Device = keyof typeof DEVICES;

export function LivePreview({ page }: { page: any | null }) {
  const [device, setDevice] = useState<Device>("mobile");
  const [boxWidth, setBoxWidth] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const pageRef = useRef(page);
  pageRef.current = page;

  const send = () => {
    if (!pageRef.current) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "lp-preview", page: pageRef.current },
      window.location.origin
    );
  };

  // The iframe announces itself once loaded; answer with the current page.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "lp-preview-ready") send();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    send();
  });

  useEffect(() => {
    if (!boxRef.current) return;
    const ro = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, []);

  const { w, h } = DEVICES[device];
  const scale = boxWidth ? Math.min(1, boxWidth / w) : 0;

  return (
    <div className="xl:sticky xl:top-6 bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-4 min-w-0">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-black text-sm">معاينة مباشرة</h2>
        <div className="inline-flex rounded-xl bg-surface-container p-1">
          {(Object.keys(DEVICES) as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                device === d ? "bg-white shadow-card text-primary" : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-base">{DEVICES[d].icon}</span>
              {DEVICES[d].label}
            </button>
          ))}
        </div>
      </div>

      <div ref={boxRef} className="w-full">
        {!page ? (
          <div className="rounded-xl bg-surface-container-low text-on-surface-variant text-sm text-center py-24 px-6">
            اختر منتجًا لرؤية المعاينة
          </div>
        ) : (
          scale > 0 && (
            <div
              dir="ltr"
              className="relative mx-auto overflow-hidden rounded-xl ring-1 ring-outline-variant/60 bg-white"
              style={{ width: w * scale, height: h * scale }}
            >
              <iframe
                ref={frameRef}
                src="/lp-preview"
                title="معاينة صفحة الهبوط"
                className="absolute top-0 left-0 border-0"
                style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}
              />
            </div>
          )
        )}
      </div>
      <p className="text-[11px] text-on-surface-variant mt-3">
        المعاينة تتحدث مع كل تعديل. الطلبات من المعاينة لا تُرسل.
      </p>
    </div>
  );
}
