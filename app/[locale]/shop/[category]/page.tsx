import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCard } from "@/components/shop/ProductCard";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { localizedName } from "@/lib/format";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const loc = locale as Locale;
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return { title: "ZED INFORMATIQUE" };
  }
  try {
    const catDoc: any = await fetchQuery(api.categories.bySlug, { slug: category });
    const name = catDoc ? localizedName(catDoc, loc) : category;
    return {
      title: `${name} | ZED INFORMATIQUE`,
      description: `Achetez ${name} en Algérie — livraison dans les 58 wilayas.`,
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

  const [catDoc, products] = await Promise.all([
    safeFetch(() => fetchQuery(api.categories.bySlug, { slug: category }), null),
    safeFetch(() => fetchQuery(api.products.list, { categorySlug: category }), []),
  ]);

  if (!catDoc && process.env.NEXT_PUBLIC_CONVEX_URL) notFound();

  return (
    <div>
      {/* Category hero */}
      <section className="bg-surface-container-low py-16 lg:py-20 border-b border-outline-variant">
        <div className="container-zed">
          <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-4">
            <a href={`/${locale}/shop`}>{ts("sort")}</a> /{" "}
            <span className="text-primary">
              {catDoc ? localizedName(catDoc, loc) : category}
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase">
            {catDoc ? localizedName(catDoc, loc) : category}
          </h1>
          <p className="text-on-surface-variant mt-4">
            {ts("results", { count: products.length })}
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container-zed">
          {products.length === 0 ? (
            <div className="text-center py-24 text-on-surface-variant">
              {ts("noResults")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {products.map((p: any) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  locale={loc}
                  label={tc("inStock")}
                  addLabel={tc("addToCart")}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
