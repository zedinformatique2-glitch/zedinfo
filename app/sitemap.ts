import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zed-informatique.vercel.app";
  const now = new Date();

  const staticPages = [
    "",
    "/shop",
    "/configurator",
    "/about",
    "/support",
    "/cart",
    "/track",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of ["fr", "ar"]) {
    for (const page of staticPages) {
      entries.push({
        url: `${siteUrl}/${locale}${page}`,
        lastModified: now,
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1.0 : 0.7,
      });
    }
  }

  return entries;
}
