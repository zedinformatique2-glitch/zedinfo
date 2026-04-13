import { setRequestLocale } from "next-intl/server";
import { FpsEstimatorStandalone } from "@/components/fps-estimator/FpsEstimatorStandalone";

export const revalidate = 3600;

export default async function FpsEstimatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FpsEstimatorStandalone />;
}
