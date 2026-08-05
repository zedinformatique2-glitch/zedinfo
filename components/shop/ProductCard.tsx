"use client";

import Image from "next/image";
import { useState } from "react";
import { Link } from "@/lib/i18n/routing";
import { useCart } from "@/lib/cart-store";
import { Icon } from "@/components/ui/Icon";
import { formatDzd, localizedName, localizedRequiresBuildNote } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { RequiresBuildModal } from "@/components/shop/RequiresBuildModal";

export type ProductCardData = {
  _id?: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  priceDzd: number;
  comparePriceDzd?: number;
  images: string[];
  stock: number;
  brand?: string;
  requiresBuild?: boolean;
  requiresBuildNoteFr?: string;
  requiresBuildNoteAr?: string;
  requiresBuildNoteEn?: string;
};

export function ProductCard({
  product,
  locale,
  label,
  outOfStockLabel,
  addLabel,
  requiresBuildLabels,
}: {
  product: ProductCardData;
  locale: Locale;
  label: string;
  outOfStockLabel?: string;
  addLabel: string;
  requiresBuildLabels?: {
    badge: string;
    title: string;
    body: string;
    contactCta: string;
    configureCta: string;
    close: string;
    infoCta: string;
  };
}) {
  const add = useCart((s) => s.add);
  const image = product.images[0];
  const name = localizedName(product, locale);
  const inStock = product.stock > 0;
  const [noteOpen, setNoteOpen] = useState(false);

  const hasPromo =
    product.comparePriceDzd !== undefined &&
    product.comparePriceDzd > product.priceDzd;
  const discountPct = hasPromo
    ? Math.round(
        ((product.comparePriceDzd! - product.priceDzd) /
          product.comparePriceDzd!) *
          100,
      )
    : null;

  const showRequiresBuild = !!product.requiresBuild && !!requiresBuildLabels;
  const customNote = localizedRequiresBuildNote(product, locale);
  const modalBody = customNote ?? requiresBuildLabels?.body ?? "";

  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "213663287772";
  const waMessage =
    locale === "ar"
      ? `مرحبًا، أريد الاستفسار عن: ${product.nameAr}`
      : locale === "en"
        ? `Hello, I'd like to ask about: ${product.nameFr}`
        : `Bonjour, je souhaite me renseigner sur : ${product.nameFr}`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden ring-1 ring-outline-variant/40 hover:ring-primary/30">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square bg-gradient-to-br from-surface-container-low to-white overflow-hidden">
          {image && (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-4 sm:p-6 md:p-8 group-hover:scale-[1.08] transition-transform duration-500 ease-out"
            />
          )}

          {/* Stock pill */}
          <div className="absolute top-2 start-2 sm:top-3 sm:start-3 md:top-4 md:start-4">
            {inStock ? (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/90 backdrop-blur px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-700 shadow-sm">
                <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-emerald-500" />
                {label}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant shadow-sm">
                {outOfStockLabel ?? "—"}
              </span>
            )}
          </div>

          {/* Brand chip — desktop only; hidden when a discount chip takes its slot */}
          {product.brand && !hasPromo && (
            <div className="absolute top-2 end-2 sm:top-3 sm:end-3 md:top-4 md:end-4 hidden sm:block">
              <span className="inline-flex items-center rounded-full bg-on-surface/85 backdrop-blur px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                {product.brand}
              </span>
            </div>
          )}

          {/* Discount chip — shown when comparePriceDzd > priceDzd */}
          {hasPromo && discountPct !== null && (
            <div className="absolute top-2 end-2 sm:top-3 sm:end-3 md:top-4 md:end-4">
              <span className="inline-flex items-center rounded-full bg-rose-500 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-black text-white shadow-sm">
                −{discountPct}%
              </span>
            </div>
          )}
        </div>
      </Link>

      {showRequiresBuild && requiresBuildLabels && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setNoteOpen(true);
          }}
          aria-label={requiresBuildLabels.badge}
          className="absolute top-12 start-2 sm:top-14 sm:start-3 md:top-16 md:start-4 z-10 inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-amber-500/95 backdrop-blur px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-white shadow-sm hover:bg-amber-600 transition"
        >
          <Icon name="build" className="text-[10px] sm:text-xs" />
          <span>{requiresBuildLabels.badge}</span>
        </button>
      )}

      <div className="flex flex-1 flex-col p-3 sm:p-4 md:p-5">
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="font-bold text-[12px] sm:text-[14px] md:text-[15px] leading-snug uppercase tracking-tight line-clamp-2 min-h-[2.6em] text-on-surface group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        {/* Price — hidden entirely when out of stock; we no longer advertise a
            price for something we can't sell. */}
        <div className="mt-2 sm:mt-3 flex items-baseline gap-2 min-h-[1.75rem] sm:min-h-[2rem]">
          {inStock ? (
            <>
              <span className="text-primary text-base sm:text-xl md:text-2xl font-black tracking-tight">
                {formatDzd(product.priceDzd, locale)}
              </span>
              {hasPromo && (
                <span className="text-on-surface-variant/70 text-[11px] sm:text-xs md:text-sm line-through">
                  {formatDzd(product.comparePriceDzd!, locale)}
                </span>
              )}
            </>
          ) : (
            <span className="text-on-surface-variant text-sm sm:text-base font-bold uppercase tracking-wide">
              {outOfStockLabel ?? ""}
            </span>
          )}
        </div>

        {/* Build-only products can't be added to the cart at all — the button
            is swapped for one that opens the modal with the WhatsApp /
            configurator CTAs. */}
        {showRequiresBuild && requiresBuildLabels ? (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            aria-label={requiresBuildLabels.title}
            className="mt-3 sm:mt-4 md:mt-5 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-amber-500 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-white shadow-[0_8px_20px_-8px_rgba(245,158,11,0.5)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
          >
            <Icon name="build" className="text-xs sm:text-sm" />
            <span className="truncate">{requiresBuildLabels.infoCta}</span>
          </button>
        ) : (
          <button
            disabled={!inStock || !!product.requiresBuild}
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
            aria-label={addLabel}
            className="mt-3 sm:mt-4 md:mt-5 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-primary px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-white shadow-[0_8px_20px_-8px_rgba(0,53,208,0.5)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(0,53,208,0.55)] hover:brightness-110 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_20px_-8px_rgba(0,53,208,0.5)]"
          >
            <Icon name="add_shopping_cart" className="text-xs sm:text-sm" />
            <span className="truncate">{addLabel}</span>
          </button>
        )}
      </div>

      {showRequiresBuild && requiresBuildLabels && (
        <RequiresBuildModal
          open={noteOpen}
          onClose={() => setNoteOpen(false)}
          title={requiresBuildLabels.title}
          body={modalBody}
          contactCta={requiresBuildLabels.contactCta}
          configureCta={requiresBuildLabels.configureCta}
          closeLabel={requiresBuildLabels.close}
          whatsappUrl={whatsappUrl}
        />
      )}
    </div>
  );
}
