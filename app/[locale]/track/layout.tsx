import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: buildAlternates(locale as Locale, "/track") };
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
