"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "@/lib/i18n/routing";
import { useLocale } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/i18n/config";

/* Map parent-category slugs to the static images in /public/categories/categories/ */
const CATEGORY_IMAGES: Record<string, string> = {
  "pc-components": "/categories/categories/cpu.jpg",
  "storage-devices": "/categories/categories/storage.jpg",
  "peripherals": "/categories/categories/peripherals.jpg",
  "desktops": "/categories/categories/case.jpg",
  "laptops": "/categories/categories/motherboard.jpg",
  "printers-scanners": "/categories/categories/psu.jpg",
  "accessories": "/categories/categories/ram.jpg",
  "networking": "/categories/categories/gpu.jpg",
  "furniture": "/categories/categories/furniture.jpg",
};

export function CategoryGrid() {
  const parents = useQuery(api.categories.listParents, {});
  const locale = useLocale() as Locale;

  if (!parents) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-surface-container animate-pulse aspect-[4/3]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {parents.map((cat) => {
        const image = CATEGORY_IMAGES[cat.slug];
        return (
          <Link
            key={cat._id}
            href={`/shop/${cat.slug}`}
            className="group relative rounded-2xl overflow-hidden bg-surface-container shadow-card ring-1 ring-outline-variant/30 transition-all hover:shadow-card-hover hover:-translate-y-0.5"
          >
            {/* Image or gradient+icon fallback */}
            <div className="aspect-[4/3] overflow-hidden">
              {image ? (
                <Image
                  src={image}
                  alt={locale === "ar" ? cat.nameAr : cat.nameFr}
                  width={400}
                  height={300}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <Icon name={cat.icon} className="text-[48px] text-primary/60" />
                </div>
              )}
            </div>

            {/* Label */}
            <div className="px-3 py-3">
              <p className="text-center text-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
                {locale === "ar" ? cat.nameAr : cat.nameFr}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
