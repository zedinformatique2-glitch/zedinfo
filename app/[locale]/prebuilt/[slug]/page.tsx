import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/Badge";
import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Locale } from "@/lib/i18n/config";
import { formatDzd, localizedDesc, localizedName } from "@/lib/format";
import { buildAlternates } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const alternates = buildAlternates(loc, `/prebuilt/${slug}`);
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return { title: "ZED INFORMATIQUE", alternates };
  }
  try {
    const pb: any = await fetchQuery(api.prebuilts.bySlug, { slug });
    if (!pb) return { title: "ZED INFORMATIQUE", alternates };
    const name = localizedName(pb, loc);
    const desc = localizedDesc(pb, loc);
    return {
      title: `${name} | ZED INFORMATIQUE`,
      description: desc || `${name} — ${formatDzd(pb.priceDzd, loc)}`,
      alternates,
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

export default async function PrebuiltPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const tc = await getTranslations({ locale, namespace: "common" });

  const pb: any = await safeFetch(
    () => fetchQuery(api.prebuilts.bySlug, { slug }),
    null
  );
  if (!pb && process.env.NEXT_PUBLIC_CONVEX_URL) notFound();
  if (!pb) {
    return <div className="container-zed py-24 text-center">{tc("loading")}</div>;
  }

  return (
    <article>
      <section className="bg-slate-950 text-white py-16 lg:py-24">
        <div className="container-zed grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-square bg-slate-900 rounded-3xl ring-1 ring-white/10 shadow-card overflow-hidden">
            {pb.heroImage && (
              <Image src={pb.heroImage} alt="" fill className="object-contain p-8" priority />
            )}
          </div>
          <div>
            <Badge>PC Prêt</Badge>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase mt-4 mb-6">
              {localizedName(pb, loc)}
            </h1>
            <p className="text-slate-400 mb-8">{localizedDesc(pb, loc)}</p>
            <div className="text-4xl font-black text-primary-fixed">
              {formatDzd(pb.priceDzd, loc)}
            </div>
          </div>
        </div>
      </section>

      {pb.benchmarks?.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="container-zed">
            <h2 className="text-3xl font-black tracking-tight uppercase mb-8">
              Benchmarks
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pb.benchmarks.map((b: any) => (
                <div key={b.game} className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary-container to-primary" />
                  <div className="font-bold uppercase mb-4">{b.game}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>1080p</span>
                      <span className="font-black">{b.fps1080} fps</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1440p</span>
                      <span className="font-black">{b.fps1440} fps</span>
                    </div>
                    <div className="flex justify-between">
                      <span>4K</span>
                      <span className="font-black">{b.fps4k} fps</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
