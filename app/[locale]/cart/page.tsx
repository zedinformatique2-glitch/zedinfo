"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { useCart } from "@/lib/cart-store";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { formatDzd, localizedName } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const locale = useLocale() as Locale;
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const items = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotal());

  if (!mounted) {
    return <div className="container-zed py-24 text-center">{tc("loading")}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-zed py-24 text-center">
        <Icon name="shopping_cart" className="text-6xl text-outline-variant mb-4" />
        <h1 className="text-3xl font-black uppercase mb-4">{t("empty")}</h1>
        <Link href="/shop">
          <Button>{t("emptyCta")}</Button>
        </Link>
      </div>
    );
  }

  const shipping = 800;
  const total = subtotal + shipping;

  return (
    <div className="container-zed py-12 lg:py-16">
      <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-tighter uppercase mb-6 sm:mb-12">
        {t("title")}
      </h1>
      <div className="grid lg:grid-cols-3 gap-6 sm:gap-12">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.slug}
              className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 hover:ring-primary/30 transition-all"
            >
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-white to-surface-container-low rounded-xl ring-1 ring-outline-variant/30 shrink-0 relative overflow-hidden">
                {item.image && (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 64px, 96px"
                    className="object-contain p-2"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold uppercase tracking-tight truncate text-sm sm:text-base">
                  {localizedName(item, locale)}
                </h3>
                <div className="text-primary font-black text-base sm:text-lg mt-1">
                  {formatDzd(item.priceDzd, locale)}
                </div>
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto sm:gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/30">
                <div className="flex items-center rounded-xl ring-1 ring-outline-variant/60 bg-white overflow-hidden">
                  <button
                    onClick={() => updateQty(item.slug, item.qty - 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <Icon name="remove" />
                  </button>
                  <span className="w-10 text-center font-bold">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.slug, item.qty + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <Icon name="add" />
                  </button>
                </div>
                <button
                  onClick={() => remove(item.slug)}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors"
                  aria-label={t("remove")}
                >
                  <Icon name="delete" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="bg-white rounded-3xl shadow-card ring-1 ring-outline-variant/40 p-6 lg:p-8 sticky top-24 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary-container to-primary" />
            <h2 className="font-bold uppercase tracking-widest text-xs mb-6">
              {t("orderSummary")}
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{tc("subtotal")}</span>
                <span className="font-bold">{formatDzd(subtotal, locale)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{tc("shipping")}</span>
                <span className="font-bold">{formatDzd(shipping, locale)}</span>
              </div>
              <div className="border-t border-outline-variant pt-3 flex justify-between">
                <span className="font-bold uppercase">{tc("total")}</span>
                <span className="font-black text-primary text-xl">
                  {formatDzd(total, locale)}
                </span>
              </div>
            </div>
            <Link href="/checkout" className="block">
              <Button className="w-full">{t("checkout")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
