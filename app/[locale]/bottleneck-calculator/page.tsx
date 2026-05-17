import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { BottleneckCalculator } from "@/components/bottleneck/BottleneckCalculator";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bottleneck.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/bottleneck-calculator`,
      languages: {
        fr: "/fr/bottleneck-calculator",
        ar: "/ar/bottleneck-calculator",
        en: "/en/bottleneck-calculator",
      },
    },
  };
}

export default async function BottleneckCalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BottleneckCalculator />;
}
