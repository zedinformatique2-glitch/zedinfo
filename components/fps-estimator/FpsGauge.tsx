"use client";

import { useEffect, useRef, useState } from "react";

const MAX_FPS = 240;

export function fpsTier(fps: number) {
  if (fps < 30) return { key: "unplayable", color: "#ef4444" } as const;
  if (fps < 60) return { key: "playable", color: "#f59e0b" } as const;
  if (fps < 144) return { key: "smooth", color: "#22c55e" } as const;
  return { key: "competitive", color: "#a78bfa" } as const;
}

/** Semicircle gauge with a one-shot count-up. */
export function FpsGauge({ fps, label }: { fps: number; label: string }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  const tier = fpsTier(fps);

  // One-shot count from the previous value to the new one.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const origin = from.current;
    const duration = origin === 0 ? 1100 : 600;
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = origin + (fps - origin) * eased;
      from.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fps]);

  const progress = Math.min(shown / MAX_FPS, 1);

  // Arc from the left (0 fps) to the right (240 fps), radius 90, centre (110,110)
  const arc = "M 20 110 A 90 90 0 0 1 200 110";
  const ticks = [0, 30, 60, 144, 240];

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <svg viewBox="0 -12 220 140" className="w-full overflow-visible">
        <defs>
          <linearGradient id="fpsArc" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="20%" stopColor="#f59e0b" />
            <stop offset="45%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <path d={arc} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
        <path
          d={arc}
          fill="none"
          stroke="url(#fpsArc)"
          strokeWidth="14"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100 100"
          strokeDashoffset={100 - progress * 100}
        />
        {ticks.map((v) => {
          const a = Math.PI - (v / MAX_FPS) * Math.PI;
          const x1 = 110 + Math.cos(a) * 99;
          const y1 = 110 - Math.sin(a) * 99;
          const x2 = 110 + Math.cos(a) * 103;
          const y2 = 110 - Math.sin(a) * 103;
          const tx = 110 + Math.cos(a) * 112;
          const ty = 110 - Math.sin(a) * 112;
          return (
            <g key={v}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
              <text x={tx} y={ty + 3} textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.9)" fontWeight="600">
                {v}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div
          className="text-6xl sm:text-7xl font-black leading-none tabular-nums"
          style={{ color: tier.color }}
        >
          {Math.round(shown)}
        </div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{label}</div>
      </div>
    </div>
  );
}
