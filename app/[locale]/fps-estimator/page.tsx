import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { FpsEstimatorStandalone } from "@/components/fps-estimator/FpsEstimatorStandalone";
import { buildAlternates } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "fpsEstimator.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates(locale as Locale, "/fps-estimator"),
  };
}

export default async function FpsEstimatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FpsEstimatorStandalone />;
}
