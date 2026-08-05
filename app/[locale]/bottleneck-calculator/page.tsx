import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { BottleneckCalculator } from "@/components/bottleneck/BottleneckCalculator";
import { buildAlternates } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";

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
    alternates: buildAlternates(locale as Locale, "/bottleneck-calculator"),
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
