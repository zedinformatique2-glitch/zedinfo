import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const LOCALES = ["ar", "fr", "en"] as const;

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://www.zed-informatique.com"
  );
}

function alternatesFor(path: string, siteUrl: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `${siteUrl}/${l}${path}`;
  languages["x-default"] = `${siteUrl}/ar${path}`;
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticPaths: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/shop", changeFrequency: "daily", priority: 0.9 },
    { path: "/configurator", changeFrequency: "weekly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.5 },
    { path: "/support", changeFrequency: "monthly", priority: 0.5 },
    { path: "/track", changeFrequency: "monthly", priority: 0.3 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const s of staticPaths) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${siteUrl}/${locale}${s.path}`,
        lastModified: now,
        changeFrequency: s.changeFrequency,
        priority: s.priority,
        alternates: { languages: alternatesFor(s.path, siteUrl) },
      });
    }
  }

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return entries;

  try {
    const [products, categories, prebuilts] = await Promise.all([
      fetchQuery(api.products.list, {}).catch(() => [] as any[]),
      fetchQuery(api.categories.list, {}).catch(() => [] as any[]),
      fetchQuery(api.prebuilts.list, {}).catch(() => [] as any[]),
    ]);

    for (const p of products ?? []) {
      const path = `/product/${p.slug}`;
      const lastModified = p._creationTime ? new Date(p._creationTime) : now;
      for (const locale of LOCALES) {
        entries.push({
          url: `${siteUrl}/${locale}${path}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.8,
          alternates: { languages: alternatesFor(path, siteUrl) },
        });
      }
    }

    for (const c of categories ?? []) {
      if (!c.slug) continue;
      const path = `/shop/${c.slug}`;
      for (const locale of LOCALES) {
        entries.push({
          url: `${siteUrl}/${locale}${path}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.7,
          alternates: { languages: alternatesFor(path, siteUrl) },
        });
      }
    }

    for (const pb of prebuilts ?? []) {
      if (!pb.slug) continue;
      const path = `/prebuilt/${pb.slug}`;
      for (const locale of LOCALES) {
        entries.push({
          url: `${siteUrl}/${locale}${path}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.75,
          alternates: { languages: alternatesFor(path, siteUrl) },
        });
      }
    }
  } catch {
    // If Convex fetch fails at build time, fall back to static entries
  }

  return entries;
}
