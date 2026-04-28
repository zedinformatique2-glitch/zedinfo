import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { ShopAllProducts } from "@/components/shop/ShopAllProducts";
import type { Locale } from "@/lib/i18n/config";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: buildAlternates(locale as Locale, "/shop") };
}

export default async function ShopIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const tShop = await getTranslations({ locale, namespace: "shop" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const t = {
    allProducts: tShop("allProducts"),
    categories: tShop("categories"),
    filters: tShop("filters"),
    clearFilters: tShop("clearFilters"),
    loadMore: tShop("loadMore"),
    inStockOnly: tShop("inStockOnly"),
    minPrice: tShop("minPrice"),
    maxPrice: tShop("maxPrice"),
    showing: tShop.raw("showing") as string,
    noResults: tShop("noResults"),
    sortByLabel: tShop("sortByLabel"),
    sortNewest: tShop("sortBy.newest"),
    sortPriceAsc: tShop("sortBy.priceAsc"),
    sortPriceDesc: tShop("sortBy.priceDesc"),
    priceRange: tShop("priceRange"),
    availability: tShop("availability"),
    inStock: tCommon("inStock"),
    addToCart: tCommon("addToCart"),
  };

  return <ShopAllProducts locale={locale as Locale} t={t} initialSearch={q} />;
}
