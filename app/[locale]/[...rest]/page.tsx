import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

// Any unknown URL under a locale lands here so it gets the branded,
// translated not-found page instead of Next's bare default 404.
export default async function CatchAllNotFound({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
