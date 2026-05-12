"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "@/lib/i18n/routing";
import { useCart } from "@/lib/cart-store";
import { Icon } from "@/components/ui/Icon";
import { formatDzd, localizedName } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";

type Product = {
  _id?: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  priceDzd: number;
  comparePriceDzd?: number;
  images: string[];
  stock: number;
  brand?: string;
};

export function PromoCarousel({
  products,
  locale,
  addLabel,
  promoLabel,
}: {
  products: Product[];
  locale: Locale;
  addLabel: string;
  promoLabel: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      dragFree: true,
      direction: locale === "ar" ? "rtl" : "ltr",
    },
    [
      Autoplay({
        delay: 2800,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        playOnInit: true,
      }),
    ]
  );

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative">
      {/* Prev / Next buttons (desktop only) */}
      <button
        type="button"
        onClick={scrollPrev}
        disabled={!canPrev}
        aria-label="Previous"
        className="hidden md:flex absolute -top-16 end-14 z-20 h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Icon name="arrow_back" className="text-base" flip />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        disabled={!canNext}
        aria-label="Next"
        className="hidden md:flex absolute -top-16 end-2 z-20 h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Icon name="arrow_forward" className="text-base" flip />
      </button>

      {/* Embla viewport — masks edges and clips overflow */}
      <div
        ref={emblaRef}
        className="marquee-mask overflow-hidden -mx-4 sm:-mx-6 lg:-mx-12 px-4 sm:px-6 lg:px-12 py-2 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-stretch gap-5 md:gap-6 touch-pan-y">
          {products.map((p) => (
            <PromoCard
              key={p._id ?? p.slug}
              product={p}
              locale={locale}
              addLabel={addLabel}
              promoLabel={promoLabel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PromoCard({
  product,
  locale,
  addLabel,
  promoLabel,
}: {
  product: Product;
  locale: Locale;
  addLabel: string;
  promoLabel: string;
}) {
  const add = useCart((s) => s.add);
  const image = product.images[0];
  const name = localizedName(product, locale);
  const inStock = product.stock > 0;
  const discount =
    product.comparePriceDzd && product.comparePriceDzd > product.priceDzd
      ? Math.round(
          ((product.comparePriceDzd - product.priceDzd) /
            product.comparePriceDzd) *
            100
        )
      : null;

  return (
    <div className="group/card relative shrink-0 w-[260px] sm:w-[280px] md:w-[300px] flex flex-col bg-white/[0.04] backdrop-blur-sm rounded-2xl ring-1 ring-white/10 hover:ring-primary-fixed/40 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07]">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square bg-gradient-to-br from-white to-slate-100 overflow-hidden">
          {image && (
            <Image
              src={image}
              alt={name}
              fill
              sizes="300px"
              className="object-contain p-6 group-hover/card:scale-110 transition-transform duration-500 pointer-events-none"
              draggable={false}
            />
          )}

          {/* Promo badge */}
          <div className="absolute top-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {promoLabel}
          </div>

          {discount !== null && (
            <div className="absolute top-3 end-3 inline-flex items-center rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-black text-white shadow-lg">
              −{discount}%
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        {product.brand && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
            {product.brand}
          </div>
        )}
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="font-bold text-[14px] leading-snug uppercase tracking-tight line-clamp-2 min-h-[2.6em] text-white group-hover/card:text-primary-fixed transition-colors">
            {name}
          </h3>
        </Link>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-primary-fixed text-xl font-black tracking-tight">
            {formatDzd(product.priceDzd, locale)}
          </span>
          {product.comparePriceDzd &&
            product.comparePriceDzd > product.priceDzd && (
              <span className="text-white/40 text-xs line-through">
                {formatDzd(product.comparePriceDzd, locale)}
              </span>
            )}
        </div>

        <button
          disabled={!inStock}
          onClick={() =>
            add({
              productId: product._id,
              slug: product.slug,
              nameFr: product.nameFr,
              nameAr: product.nameAr,
              priceDzd: product.priceDzd,
              image: image ?? "",
            })
          }
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_8px_20px_-8px_rgba(0,53,208,0.7)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="add_shopping_cart" className="text-sm" />
          {addLabel}
        </button>
      </div>
    </div>
  );
}
