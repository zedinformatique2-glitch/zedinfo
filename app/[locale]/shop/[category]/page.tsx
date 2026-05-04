import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCard } from "@/components/shop/ProductCard";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { localizedName } from "@/lib/format";
import { buildRequiresBuildLabels } from "@/lib/requires-build-labels";
import {
  buildAlternates,
  categorySeo,
  siteUrl,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const loc = locale as Locale;
  const alternates = buildAlternates(loc, `/shop/${category}`);
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return { title: "ZED INFORMATIQUE", alternates };
  }
  try {
    const catDoc: any = await fetchQuery(api.categories.bySlug, { slug: category });
    const name = catDoc ? localizedName(catDoc, loc) : category;
    const copy = categorySeo(category, loc);
    const title = copy ? copy.title : name;
    const description =
      copy?.description ??
      (loc === "ar"
        ? `${name} في الجزائر — توصيل لـ 58 ولاية، الدفع عند الاستلام، ضمان أصلي.`
        : loc === "en"
        ? `${name} in Algeria — delivery to all 58 wilayas, cash on delivery, original warranty.`
        : `${name} en Algérie — livraison dans les 58 wilayas, paiement à la livraison, garantie d'origine.`);
    return {
      title,
      description,
      alternates,
      openGraph: {
        title: `${title} | ${SITE_NAME}`,
        description,
        type: "website",
        siteName: SITE_NAME,
        images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: name }],
      },
    };
  } catch {
    return { title: "ZED INFORMATIQUE", alternates };
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

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const tc = await getTranslations({ locale, namespace: "common" });
  const ts = await getTranslations({ locale, namespace: "shop" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const tp = await getTranslations({ locale, namespace: "product" });
  const requiresBuildLabels = buildRequiresBuildLabels(tp);

  const [catDoc, products] = await Promise.all([
    safeFetch(() => fetchQuery(api.categories.bySlug, { slug: category }), null),
    safeFetch(() => fetchQuery(api.products.list, { categorySlug: category }), []),
  ]);

  if (!catDoc && process.env.NEXT_PUBLIC_CONVEX_URL) notFound();

  // If this is a parent category, also fetch its children for sub-nav
  const isParent = catDoc && !catDoc.parentId;
  const children = isParent
    ? await safeFetch(
        () => fetchQuery(api.categories.listChildren, { parentId: catDoc!._id }),
        []
      )
    : [];

  // If this is a child category, fetch the parent for breadcrumb
  let parentDoc = null;
  if (catDoc?.parentId) {
    const allCats = await safeFetch(() => fetchQuery(api.categories.list, {}), []);
    parentDoc = allCats.find((c: any) => c._id === catDoc.parentId) ?? null;
  }

  const base = siteUrl();
  const catName = catDoc ? localizedName(catDoc, loc) : category;
  const breadcrumbItems: { name: string; url: string }[] = [
    { name: loc === "ar" ? "الرئيسية" : loc === "en" ? "Home" : "Accueil", url: `${base}/${locale}` },
    { name: tn("shop"), url: `${base}/${locale}/shop` },
  ];
  if (parentDoc) {
    breadcrumbItems.push({
      name: localizedName(parentDoc, loc),
      url: `${base}/${locale}/shop/${parentDoc.slug}`,
    });
  }
  breadcrumbItems.push({
    name: catName,
    url: `${base}/${locale}/shop/${category}`,
  });
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  const itemListJsonLd =
    products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: catName,
          numberOfItems: products.length,
          itemListElement: products.slice(0, 30).map((p: any, i: number) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${base}/${locale}/product/${p.slug}`,
            name: localizedName(p, loc),
          })),
        }
      : null;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      {/* Category hero */}
      <section className="bg-surface-container-low py-16 lg:py-20 border-b border-outline-variant">
        <div className="container-zed">
          {/* Breadcrumb */}
          <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-1.5 flex-wrap">
            <a href={`/${locale}/shop`} className="hover:text-primary transition-colors">
              {tn("shop")}
            </a>
            <span>/</span>
            {parentDoc ? (
              <>
                <a
                  href={`/${locale}/shop/${parentDoc.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {localizedName(parentDoc, loc)}
                </a>
                <span>/</span>
                <span className="text-primary">
                  {catDoc ? localizedName(catDoc, loc) : category}
                </span>
              </>
            ) : (
              <span className="text-primary">
                {catDoc ? localizedName(catDoc, loc) : category}
              </span>
            )}
          </div>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase">
            {catDoc ? localizedName(catDoc, loc) : category}
          </h1>
          <p className="text-on-surface-variant mt-4">
            {ts("results", { count: products.length })}
          </p>

          {/* Sub-category chips for parent categories */}
          {isParent && children.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {children.map((child: any) => (
                <a
                  key={child._id}
                  href={`/${locale}/shop/${child.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant/40 hover:bg-primary hover:text-white hover:ring-primary transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {child.icon}
                  </span>
                  {localizedName(child, loc)}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container-zed">
          {products.length === 0 ? (
            <div className="text-center py-24 text-on-surface-variant">
              {ts("noResults")}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {products.map((p: any) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  locale={loc}
                  label={tc("inStock")}
                  addLabel={tc("addToCart")}
                  requiresBuildLabels={requiresBuildLabels}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
