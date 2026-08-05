"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { Icon } from "@/components/ui/Icon";
import { localizedName } from "@/lib/format";
import type { CartItem } from "@/lib/cart-store";
import type { Locale } from "@/lib/i18n/config";

/**
 * Shown on the cart and checkout when the cart holds a product that may only be
 * sold inside a full PC build. Blocks the order until the buyer removes it.
 */
export function RequiresBuildNotice({
  items,
  locale,
  onRemove,
}: {
  items: CartItem[];
  locale: Locale;
  onRemove: () => void;
}) {
  const t = useTranslations("cart");
  const tp = useTranslations("product");

  if (items.length === 0) return null;

  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "213663287772";
  const waMessage =
    locale === "ar"
      ? "مرحبًا، أريد الاستفسار عن منتج يتطلب تجميعة كاملة."
      : locale === "en"
        ? "Hello, I'd like to ask about a product that requires a full PC build."
        : "Bonjour, je souhaite me renseigner sur un produit nécessitant une configuration PC complète.";
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 sm:p-5 mb-4 sm:mb-6 flex items-start gap-3 sm:gap-4">
      <span className="shrink-0 w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
        <Icon name="build" className="text-[20px]" />
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm sm:text-base font-black tracking-tight text-amber-900 mb-1">
          {t("requiresBuildTitle")}
        </h3>
        <p className="text-xs sm:text-sm leading-relaxed text-amber-900/85">
          {t("requiresBuildBody")}
        </p>
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <li
              key={item.slug}
              className="text-xs sm:text-sm font-bold text-amber-900 truncate"
            >
              • {localizedName(item, locale)}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white shadow-sm hover:bg-amber-700 transition"
          >
            <Icon name="delete" className="text-xs sm:text-sm" />
            <span>{t("requiresBuildRemove")}</span>
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white shadow-sm hover:bg-emerald-600 transition"
          >
            <Icon name="chat" className="text-xs sm:text-sm" />
            <span>{tp("requiresBuildContactCta")}</span>
          </a>
          <Link
            href="/configurator"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white shadow-sm hover:brightness-110 transition"
          >
            <Icon name="memory" className="text-xs sm:text-sm" />
            <span>{tp("requiresBuildConfigureCta")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
