"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import type { Locale } from "@/lib/i18n/config";

type ColorVariant = {
  hex: string;
  nameFr?: string;
  nameAr?: string;
  image: string;
};

export function ProductGallery({
  images,
  name,
  inStock,
  inStockLabel,
  colorVariants,
  locale,
  colorLabel,
}: {
  images: string[];
  name: string;
  inStock: boolean;
  inStockLabel: string;
  colorVariants?: ColorVariant[];
  locale: Locale;
  colorLabel: string;
}) {
  const variants = (colorVariants ?? []).filter((v) => v.hex && v.image);
  const hasVariants = variants.length > 0;

  const [activeVariant, setActiveVariant] = useState(0);
  const [activeThumb, setActiveThumb] = useState(0);

  const gallery = useMemo(() => {
    if (hasVariants) return [variants[activeVariant].image, ...images.filter((i) => i !== variants[activeVariant].image)];
    return images;
  }, [hasVariants, variants, activeVariant, images]);

  const mainImage = gallery[activeThumb] || gallery[0];

  function pickVariant(i: number) {
    setActiveVariant(i);
    setActiveThumb(0);
  }

  const variantLabel = (v: ColorVariant) =>
    (locale === "ar" ? v.nameAr : v.nameFr) || v.nameFr || v.nameAr || "";

  return (
    <div>
      <div className="aspect-square bg-gradient-to-br from-white to-surface-container-low rounded-3xl shadow-card ring-1 ring-outline-variant/40 p-8 relative overflow-hidden">
        {mainImage && (
          <Image
            src={mainImage}
            alt={name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-8"
          />
        )}
        {inStock && <Badge className="absolute top-6 start-6">{inStockLabel}</Badge>}
      </div>

      {hasVariants && (
        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">
            {colorLabel}
            {variants[activeVariant] && variantLabel(variants[activeVariant]) && (
              <span className="ms-2 text-on-surface font-black">
                — {variantLabel(variants[activeVariant])}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => {
              const active = i === activeVariant;
              const label = variantLabel(v);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickVariant(i)}
                  aria-label={label || v.hex}
                  title={label || v.hex}
                  className={`relative w-9 h-9 rounded-full ring-2 transition-all ${
                    active ? "ring-primary scale-110 shadow-md" : "ring-outline-variant/60 hover:ring-primary/50"
                  }`}
                  style={{ backgroundColor: v.hex }}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-full ring-2 ring-white/80 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-3 mt-4">
          {gallery.slice(0, 8).map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setActiveThumb(i)}
              className={`aspect-square bg-white rounded-2xl ring-1 shadow-card relative overflow-hidden transition-all ${
                activeThumb === i ? "ring-primary ring-2" : "ring-outline-variant/40 hover:ring-primary/40"
              }`}
            >
              <Image src={img} alt="" fill sizes="120px" className="object-contain p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
