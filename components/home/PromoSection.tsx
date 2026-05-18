"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Link } from "@/lib/i18n/routing";
import { ProductCard } from "@/components/shop/ProductCard";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/i18n/config";
import { buildRequiresBuildLabels } from "@/lib/requires-build-labels";

export function PromoSection({
  locale,
  eyebrow,
  title,
  subtitle,
  inStockLabel,
  addLabel,
  viewAllLabel,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  subtitle: string;
  inStockLabel: string;
  addLabel: string;
  viewAllLabel: string;
}) {
  const products = useQuery(api.products.listPromo, { limit: 8 });
  const tp = useTranslations("product");
  const requiresBuildLabels = buildRequiresBuildLabels(tp);

  if (products && products.length === 0) return null;

  return (
    <section className="bg-surface py-16 lg:py-24">
      <div className="container-zed">
        <div className="flex items-end justify-between mb-10 lg:mb-14">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-2">
              {eyebrow}
            </span>
            <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase mb-2">
              {title}
            </h2>
            <p className="text-on-surface-variant text-sm sm:text-base max-w-xl">
              {subtitle}
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            {viewAllLabel}
            <Icon name="arrow_forward" className="text-base" flip />
          </Link>
        </div>

        {!products ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface rounded-2xl shadow-card ring-1 ring-outline-variant/40 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-surface-container" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-surface-container rounded w-3/4" />
                  <div className="h-4 bg-surface-container rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {products.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                locale={locale}
                label={inStockLabel}
                addLabel={addLabel}
                requiresBuildLabels={requiresBuildLabels}
              />
            ))}
          </div>
        )}

        <div className="flex sm:hidden justify-center mt-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
          >
            {viewAllLabel}
            <Icon name="arrow_forward" className="text-base" flip />
          </Link>
        </div>
      </div>
    </section>
  );
}
