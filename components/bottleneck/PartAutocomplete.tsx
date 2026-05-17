"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { useLocale } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Suggestion = {
  _id: Id<"products">;
  slug: string;
  nameFr: string;
  nameAr: string;
  brand: string;
  priceDzd: number;
  specs: Record<string, unknown>;
};

export type PartSelection =
  | { kind: "catalog"; product: Suggestion; freeText: null }
  | { kind: "freeText"; product: null; freeText: string };

export function PartAutocomplete({
  specType,
  value,
  onChange,
  label,
  placeholder,
}: {
  specType: "cpu" | "gpu";
  value: string;
  onChange: (next: PartSelection) => void;
  label: string;
  placeholder: string;
}) {
  const locale = useLocale();
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(value);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const suggestions = useQuery(
    api.products.searchByType,
    debounced.trim().length === 0 ? "skip" : { specType, q: debounced, limit: 8 }
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(s: Suggestion) {
    const name = locale === "ar" ? s.nameAr : s.nameFr;
    setQuery(name);
    setOpen(false);
    onChange({ kind: "catalog", product: s, freeText: null });
  }

  function onInputChange(v: string) {
    setQuery(v);
    setOpen(true);
    onChange({ kind: "freeText", product: null, freeText: v });
  }

  return (
    <div className="relative" ref={boxRef}>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {open && suggestions && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl bg-slate-900/95 backdrop-blur ring-1 ring-white/15 shadow-card max-h-72 overflow-auto">
          {suggestions.map((s) => {
            const name = locale === "ar" ? s.nameAr : s.nameFr;
            return (
              <button
                key={s._id}
                type="button"
                onClick={() => pick(s)}
                className="w-full text-start px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors flex items-baseline justify-between gap-3"
              >
                <span className="truncate">{name}</span>
                <span className="text-xs text-slate-400 shrink-0">{s.brand}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
