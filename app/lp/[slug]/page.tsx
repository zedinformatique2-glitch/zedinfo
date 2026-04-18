import { notFound } from "next/navigation";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { LandingPageClient } from "./LandingPageClient";

export const dynamic = "force-dynamic";

async function fetchPage(slug: string) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  const client = new ConvexHttpClient(url);
  return await client.query(api.landingPages.getBySlug, { slug });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) return { title: "ZED Informatique" };
  return {
    title: page.headlineFr,
    description: page.subheadlineFr || page.product?.descFr,
    openGraph: {
      title: page.headlineFr,
      description: page.subheadlineFr || page.product?.descFr,
      images: page.heroImage ? [page.heroImage] : page.product?.images?.slice(0, 1),
    },
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) notFound();
  return <LandingPageClient page={page} />;
}
