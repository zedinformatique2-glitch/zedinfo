import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AddToCartBar } from "@/components/product/AddToCartBar";
import { DirectBuyForm } from "@/components/product/DirectBuyForm";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/shop/ProductCard";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { formatDzd, localizedDesc, localizedName } from "@/lib/format";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return { title: "ZED INFORMATIQUE" };
  }
  try {
    const product: any = await fetchQuery(api.products.bySlug, { slug });
    if (!product) return { title: "ZED INFORMATIQUE" };
    const name = localizedName(product, loc);
    const desc = localizedDesc(product, loc);
    return {
      title: `${name} | ZED INFORMATIQUE`,
      description: desc || `${name} — ${formatDzd(product.priceDzd, loc)}`,
      openGraph: {
        title: `${name} | ZED INFORMATIQUE`,
        description: desc || `${name} — ${formatDzd(product.priceDzd, loc)}`,
        images: product.images?.[0] ? [product.images[0]] : [],
      },
    };
  } catch {
    return { title: "ZED INFORMATIQUE" };
  }
}

async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const tc = await getTranslations({ locale, namespace: "common" });
  const tp = await getTranslations({ locale, namespace: "product" });

  const product: any = await safeFetch(
    () => fetchQuery(api.products.bySlug, { slug }),
    null
  );
  if (!product && process.env.NEXT_PUBLIC_CONVEX_URL) notFound();
  if (!product) {
    return (
      <div className="container-zed py-24 text-center text-on-surface-variant">
        {tc("loading")}
      </div>
    );
  }

  const name = localizedName(product, loc);
  const desc = localizedDesc(product, loc);
  const inStock = product.stock > 0;

  const relatedRaw: any[] = product.category
    ? await safeFetch(
        () =>
          fetchQuery(api.products.list, {
            categorySlug: product.category.slug,
            limit: 8,
          }),
        []
      )
    : [];
  const related = relatedRaw
    .filter((p: any) => p._id !== product._id)
    .slice(0, 4);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://www.zed-informatique.com";
  const productUrl = `${siteUrl}/${locale}/product/${product.slug}`;
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name,
    description: desc || name,
    image: product.images?.slice(0, 5) ?? [],
    sku: product.slug,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: product.category ? localizedName(product.category, loc) : undefined,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "DZD",
      price: product.priceDzd,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <article className="bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container-zed py-8 lg:py-12">
        <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-8">
          {product.category && (
            <>
              <a href={`/${locale}/shop/${product.category.slug}`}>
                {localizedName(product.category, loc)}
              </a>{" "}
              /{" "}
            </>
          )}
          <span className="text-primary">{name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <ProductGallery
            images={product.images}
            name={name}
            inStock={inStock}
            inStockLabel={tc("inStock")}
            colorVariants={product.colorVariants}
            locale={loc}
            colorLabel={tp("color")}
          />


          {/* Info */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
              {product.brand}
            </div>
            <h1 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase mb-6">
              {name}
            </h1>
            <div className="text-4xl font-black text-primary mb-8">
              {formatDzd(product.priceDzd, loc)}
            </div>
            <p className="text-on-surface-variant leading-relaxed mb-8">{desc}</p>

            <AddToCartBar
              product={product}
              addLabel={tc("addToCart")}
              qtyLabel={tc("quantity")}
            />

            {inStock && <DirectBuyForm product={product} />}

            {/* Specs */}
            <div className="mt-12">
              <h2 className="text-[10px] uppercase tracking-widest font-bold mb-4">
                {tp("specifications")}
              </h2>
              <dl className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 divide-y divide-outline-variant/40 overflow-hidden">
                {Object.entries(product.specs || {}).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 px-5 py-3 text-sm"
                  >
                    <dt className="text-on-surface-variant uppercase tracking-wide">{k}</dt>
                    <dd className="font-bold text-end">
                      {Array.isArray(v) ? v.join(", ") : String(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20 lg:mt-28">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl lg:text-4xl font-black tracking-tighter uppercase">
                {tp("related")}
              </h2>
              {product.category && (
                <a
                  href={`/${locale}/shop/${product.category.slug}`}
                  className="text-[10px] uppercase tracking-widest font-bold text-primary hover:underline"
                >
                  {tc("viewAll")}
                </a>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {related.map((p: any) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  locale={loc}
                  label={tc("inStock")}
                  addLabel={tc("addToCart")}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
