"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { useCart, cartItemKey } from "@/lib/cart-store";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { formatDzd, localizedName } from "@/lib/format";
import { useRequiresBuildBlock } from "@/lib/use-requires-build-block";
import { RequiresBuildNotice } from "@/components/cart/RequiresBuildNotice";
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
  const requiresBuild = useRequiresBuildBlock();

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
    <div className="container-zed py-4 sm:py-12 lg:py-16 pb-28 sm:pb-12 max-w-full overflow-x-hidden">
      <h1 className="text-xl sm:text-4xl lg:text-6xl font-black tracking-tighter uppercase mb-4 sm:mb-10">
        {t("title")}
      </h1>
      <RequiresBuildNotice
        items={requiresBuild.blockedItems}
        locale={locale}
        onRemove={requiresBuild.removeBlocked}
      />
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-12">
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 min-w-0">
          {items.map((item) => {
            const key = cartItemKey(item);
            const colorName = item.selectedColor
              ? (locale === "ar" ? item.selectedColor.nameAr : item.selectedColor.nameFr) ||
                item.selectedColor.nameFr ||
                item.selectedColor.nameAr ||
                ""
              : "";
            return (
              <div
                key={key}
                className="flex items-start gap-3 p-3 sm:p-4 bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 hover:ring-primary/30 transition-all min-w-0"
              >
                <div className="w-14 h-14 sm:w-24 sm:h-24 bg-gradient-to-br from-white to-surface-container-low rounded-xl ring-1 ring-outline-variant/30 shrink-0 relative overflow-hidden">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 56px, 96px"
                      className="object-contain p-2"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold uppercase tracking-tight text-[13px] sm:text-base leading-snug line-clamp-2 break-words">
                    {localizedName(item, locale)}
                  </h3>
                  {item.selectedColor && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="inline-block w-3.5 h-3.5 rounded-full ring-1 ring-outline-variant/60"
                        style={{ backgroundColor: item.selectedColor.hex }}
                        aria-hidden
                      />
                      <span className="text-[11px] sm:text-xs text-on-surface-variant truncate">
                        {colorName || item.selectedColor.hex}
                      </span>
                    </div>
                  )}
                  <div className="text-primary font-black text-sm sm:text-lg mt-1 truncate">
                    {formatDzd(item.priceDzd, locale)}
                  </div>
                  <div className="flex items-center justify-between mt-2 sm:mt-3 gap-2">
                    <div className="flex items-center rounded-lg ring-1 ring-outline-variant/60 bg-white overflow-hidden shrink-0">
                      <button
                        onClick={() => updateQty(key, item.qty - 1)}
                        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-primary/5 hover:text-primary transition-colors"
                        aria-label="−"
                      >
                        <Icon name="remove" className="text-[18px]" />
                      </button>
                      <span className="w-8 sm:w-9 text-center font-bold text-sm">{item.qty}</span>
                      <button
                        onClick={() => updateQty(key, item.qty + 1)}
                        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-primary/5 hover:text-primary transition-colors"
                        aria-label="+"
                      >
                        <Icon name="add" className="text-[18px]" />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(key)}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors shrink-0"
                      aria-label={t("remove")}
                    >
                      <Icon name="delete" className="text-[20px]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="min-w-0">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card ring-1 ring-outline-variant/40 p-4 sm:p-6 lg:p-8 lg:sticky lg:top-24 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary-container to-primary" />
            <h2 className="font-bold uppercase tracking-widest text-xs mb-4 sm:mb-6">
              {t("orderSummary")}
            </h2>
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="flex justify-between gap-2 text-sm min-w-0">
                <span className="text-on-surface-variant shrink-0">{tc("subtotal")}</span>
                <span className="font-bold truncate text-end">{formatDzd(subtotal, locale)}</span>
              </div>
              <div className="flex justify-between gap-2 text-sm min-w-0">
                <span className="text-on-surface-variant shrink-0">{tc("shipping")}</span>
                <span className="font-bold truncate text-end">{formatDzd(shipping, locale)}</span>
              </div>
              <div className="border-t border-outline-variant pt-3 flex justify-between gap-2 min-w-0">
                <span className="font-bold uppercase shrink-0">{tc("total")}</span>
                <span className="font-black text-primary text-lg sm:text-xl truncate text-end">
                  {formatDzd(total, locale)}
                </span>
              </div>
            </div>
            {requiresBuild.blocked ? (
              <Button className="w-full" disabled>
                {t("checkout")}
              </Button>
            ) : (
              <Link href="/checkout" className="block">
                <Button className="w-full">{t("checkout")}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
