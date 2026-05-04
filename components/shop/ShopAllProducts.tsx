"use client";

import { useState, useMemo } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "./ProductCard";
import { Icon } from "@/components/ui/Icon";
import { formatDzd } from "@/lib/format";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import type { Id } from "@/convex/_generated/dataModel";
import { buildRequiresBuildLabels } from "@/lib/requires-build-labels";

type SortOption = "newest" | "priceAsc" | "priceDesc";

type Translations = {
  allProducts: string;
  categories: string;
  filters: string;
  clearFilters: string;
  loadMore: string;
  inStockOnly: string;
  minPrice: string;
  maxPrice: string;
  showing: string;
  noResults: string;
  sortByLabel: string;
  sortNewest: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  priceRange: string;
  availability: string;
  inStock: string;
  addToCart: string;
};

export function ShopAllProducts({
  locale,
  t,
  initialSearch,
}: {
  locale: Locale;
  t: Translations;
  initialSearch?: string;
}) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || initialSearch || "";
  const tp = useTranslations("product");
  const requiresBuildLabels = buildRequiresBuildLabels(tp);

  const [selectedCategory, setSelectedCategory] = useState<
    Id<"categories"> | undefined
  >(undefined);
  const [sort, setSort] = useState<SortOption>("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = useQuery(api.categories.list, {});
  const hierarchy = useQuery(api.categories.listHierarchy, {});

  // When searching, use the search API; otherwise use paginated list
  const searchResults = useQuery(
    api.products.search,
    searchQuery ? { q: searchQuery } : "skip"
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.products.listPaginated,
    searchQuery ? "skip" : (selectedCategory ? { categoryId: selectedCategory } : {}),
    { initialNumItems: 30 }
  );

  const isSearching = !!searchQuery;
  const baseResults = isSearching ? searchResults : results;

  // Client-side filtering & sorting
  const filtered = useMemo(() => {
    let items = baseResults ?? [];

    if (inStockOnly) {
      items = items.filter((p) => p.stock > 0);
    }

    const min = minPrice ? parseInt(minPrice, 10) : 0;
    const max = maxPrice ? parseInt(maxPrice, 10) : Infinity;
    if (min > 0 || max < Infinity) {
      items = items.filter((p) => p.priceDzd >= min && p.priceDzd <= max);
    }

    // Sort
    const sorted = [...items];
    if (sort === "priceAsc") sorted.sort((a, b) => a.priceDzd - b.priceDzd);
    else if (sort === "priceDesc")
      sorted.sort((a, b) => b.priceDzd - a.priceDzd);
    else sorted.sort((a, b) => b.createdAt - a.createdAt);

    return sorted;
  }, [baseResults, inStockOnly, minPrice, maxPrice, sort]);

  const hasActiveFilters =
    !!selectedCategory || inStockOnly || !!minPrice || !!maxPrice || isSearching;

  function clearFilters() {
    setSelectedCategory(undefined);
    setInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
  }

  const selectedCategoryName = categories?.find(
    (c) => c._id === selectedCategory
  );

  const filterContent = (
    <div className="space-y-6">
      {/* Categories (grouped by parent) */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-3">
          {t.categories}
        </h3>
        <div className="space-y-3">
          {hierarchy?.map((parent) => (
            <div key={parent._id}>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 mb-1.5 ps-1">
                {locale === "ar" ? parent.nameAr : parent.nameFr}
              </p>
              <div className="space-y-1 ps-1">
                {parent.children.map((cat: any) => (
                  <label
                    key={cat._id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategory === cat._id}
                      onChange={() =>
                        setSelectedCategory(
                          selectedCategory === cat._id ? undefined : cat._id
                        )
                      }
                      className="h-4 w-4 rounded-md border-outline-variant text-primary focus:ring-primary/30"
                    />
                    <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                      {locale === "ar" ? cat.nameAr : cat.nameFr}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-3">
          {t.priceRange}
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={t.minPrice}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-on-surface-variant text-xs">–</span>
          <input
            type="number"
            placeholder={t.maxPrice}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-3">
          {t.availability}
        </h3>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={() => setInStockOnly(!inStockOnly)}
            className="h-4 w-4 rounded-md border-outline-variant text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
            {t.inStockOnly}
          </span>
        </label>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full rounded-xl border border-outline-variant/50 px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          {t.clearFilters}
        </button>
      )}
    </div>
  );

  return (
    <div className="container-zed py-10 lg:py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase">
          {t.allProducts}
        </h1>
        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden inline-flex items-center gap-1.5 rounded-xl bg-surface-container px-4 py-2.5 text-sm font-semibold shadow-sm ring-1 ring-outline-variant/40"
        >
          <Icon name="tune" className="text-base" />
          {t.filters}
        </button>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {isSearching && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              &ldquo;{searchQuery}&rdquo;
              <a
                href={`/${locale}/shop`}
                className="hover:text-primary/70"
              >
                <Icon name="close" className="text-sm" />
              </a>
            </span>
          )}
          {selectedCategoryName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              {locale === "ar"
                ? selectedCategoryName.nameAr
                : selectedCategoryName.nameFr}
              <button
                onClick={() => setSelectedCategory(undefined)}
                className="hover:text-primary/70"
              >
                <Icon name="close" className="text-sm" />
              </button>
            </span>
          )}
          {inStockOnly && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">
              {t.inStockOnly}
              <button onClick={() => setInStockOnly(false)}>
                <Icon name="close" className="text-sm" />
              </button>
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">
              {minPrice ? formatDzd(parseInt(minPrice), locale) : "0"} –{" "}
              {maxPrice ? formatDzd(parseInt(maxPrice), locale) : "∞"}
              <button
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                }}
              >
                <Icon name="close" className="text-sm" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-on-surface-variant hover:text-error underline"
          >
            {t.clearFilters}
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 rounded-2xl bg-white p-5 shadow-card ring-1 ring-outline-variant/40">
            {filterContent}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-on-surface-variant">
              {t.showing.replace("{count}", String(filtered.length))}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-on-surface-variant hidden sm:block">
                {t.sortByLabel}
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-xl border border-outline-variant/50 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="newest">{t.sortNewest}</option>
                <option value="priceAsc">{t.sortPriceAsc}</option>
                <option value="priceDesc">{t.sortPriceDesc}</option>
              </select>
            </div>
          </div>

          {/* Product grid */}
          {filtered.length === 0 && (isSearching ? searchResults !== undefined : status !== "LoadingFirstPage") ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Icon
                name="search_off"
                className="text-5xl text-on-surface-variant/40 mb-4"
              />
              <p className="text-on-surface-variant">{t.noResults}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {(isSearching ? searchResults === undefined : status === "LoadingFirstPage")
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-surface-container animate-pulse aspect-[3/4]"
                    />
                  ))
                : filtered.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      locale={locale}
                      label={t.inStock}
                      addLabel={t.addToCart}
                      requiresBuildLabels={requiresBuildLabels}
                    />
                  ))}
            </div>
          )}

          {/* Load more */}
          {!isSearching && status === "CanLoadMore" && (
            <div className="flex justify-center mt-10">
              <button
                onClick={() => loadMore(30)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_8px_20px_-8px_rgba(0,53,208,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(0,53,208,0.55)]"
              >
                <Icon name="expand_more" className="text-lg" />
                {t.loadMore}
              </button>
            </div>
          )}

          {!isSearching && status === "LoadingMore" && (
            <div className="flex justify-center mt-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 end-0 w-80 max-w-[85vw] bg-white p-6 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{t.filters}</h2>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <Icon name="close" className="text-2xl" />
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}
    </div>
  );
}
