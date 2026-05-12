import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/Button";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { PromoSection } from "@/components/home/PromoSection";
import {
  buildAlternates,
  siteUrl,
  HOME_SEO,
  SITE_NAME,
  SITE_PHONE,
  SITE_AREA,
  SITE_LOGO,
  DEFAULT_OG_IMAGE,
  absUrl,
} from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";

const HERO_VIDEO = "/heroclip2.mp4";
const HERO_POSTER = "/hero1.webp";

export const revalidate = 300;

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale as Locale;
  const copy = HOME_SEO[loc] ?? HOME_SEO.fr;
  const title = `${SITE_NAME} — ${copy.title}`;
  return {
    title,
    description: copy.description,
    alternates: buildAlternates(loc, ""),
    openGraph: {
      title,
      description: copy.description,
      type: "website",
      siteName: SITE_NAME,
      locale: loc === "ar" ? "ar_DZ" : loc === "fr" ? "fr_DZ" : "en_US",
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: copy.description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function HomePage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "home" });
  const tc = await getTranslations({ locale, namespace: "common" });

  const base = siteUrl();
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${base}/#organization`,
    name: SITE_NAME,
    url: `${base}/${locale}`,
    logo: absUrl(SITE_LOGO),
    image: absUrl(DEFAULT_OG_IMAGE),
    description: HOME_SEO[locale as Locale]?.description ?? HOME_SEO.fr.description,
    areaServed: { "@type": "Country", name: SITE_AREA },
    address: { "@type": "PostalAddress", addressCountry: "DZ" },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SITE_PHONE,
        contactType: "customer service",
        areaServed: "DZ",
        availableLanguage: ["fr", "ar", "en"],
      },
    ],
    sameAs: [
      "https://www.facebook.com/zedinformatique",
      "https://www.instagram.com/zedinformatique",
    ],
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: `${base}/${locale}`,
    name: SITE_NAME,
    inLanguage: locale,
    publisher: { "@id": `${base}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/${locale}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden -mt-20">
        <div className="absolute inset-0 z-0">
          <video
            src={HERO_VIDEO}
            poster={HERO_POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Light overlay for text legibility only */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="container-zed relative z-10 pt-28 sm:pt-36 md:pt-44 pb-40 sm:pb-44 md:pb-56">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-5 sm:mb-6 text-white">
              {t("heroTitle1")}{" "}
              {t("heroTitle2") && <>{t("heroTitle2")}{" "}</>}
              {t("heroTitle3")}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-xl mb-8 sm:mb-10 leading-relaxed">
              {t("heroTagline")}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/shop">
                <Button size="sm">
                  {t("shopNow")} <span className="ms-2">&rarr;</span>
                </Button>
              </Link>
              <Link href="/configurator">
                <Button size="sm" variant="outline" className="border-white/60 text-white hover:bg-white hover:text-primary">
                  {t("buildMyPc")}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-surface-container-low" />
      </section>

      {/* Trusted Brands marquee — sits over the hero→categories fade */}
      <BrandMarquee heading={t("trustedBrands")} />

      {/* Shop by Category */}
      <section className="bg-surface-container-low py-16 lg:py-24">
        <div className="container-zed">
          <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase mb-10 lg:mb-14 text-center">
            Shop by Category
          </h2>
          <CategoryGrid />
        </div>
      </section>

      {/* Build Your Dream PC */}
      <section className="bg-surface-container-low py-16 lg:py-24">
        <div className="container-zed">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-card ring-1 ring-outline-variant/40">
            <div className="grid md:grid-cols-2 items-center">
              {/* Text + CTA */}
              <div className="p-8 sm:p-10 lg:p-14 order-2 md:order-1">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-white/70 mb-3">
                  PC Configurator
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-white mb-4">
                  {t("buildDreamTitle") ?? "Build Your Dream PC"}
                </h2>
                <p className="text-sm sm:text-base text-white/80 max-w-md mb-8 leading-relaxed">
                  {t("buildDreamDesc") ?? "Choose your components, build your perfect gaming or work setup. Our PC builder makes it easy to pick compatible parts and see the total price."}
                </p>
                <Link href="/configurator">
                  <Button size="sm" className="bg-white text-gray-900 hover:bg-white/90 shadow-lg">
                    {t("startBuilding") ?? "Start Building"} <span className="ms-2">&rarr;</span>
                  </Button>
                </Link>
              </div>

              {/* GIF side */}
              <div className="relative order-1 md:order-2 h-64 md:h-full min-h-[320px]">
                <img
                  src="/build-pc.gif"
                  alt="Gaming PC build"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/30 to-transparent md:block hidden" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent md:hidden" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <FeaturedProducts
        locale={locale as "fr" | "ar"}
        title={t("featuredTitle")}
        subtitle={t("featuredSubtitle")}
        inStockLabel={tc("inStock")}
        addLabel={tc("addToCart")}
        viewAllLabel={tc("viewAll")}
      />

      {/* Promo Products */}
      <PromoSection
        locale={locale as "fr" | "ar"}
        eyebrow={t("promoEyebrow")}
        title={t("promoTitle")}
        subtitle={t("promoSubtitle")}
        addLabel={tc("addToCart")}
        promoLabel={t("promoLabel")}
        viewAllLabel={tc("viewAll")}
      />

    </>
  );
}
