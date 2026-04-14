"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "@/lib/i18n/routing";
import { useLocale } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/i18n/config";

export function CategoryGrid() {
  const parents = useQuery(api.categories.listParents, {});
  const locale = useLocale() as Locale;

  if (!parents) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-surface-container animate-pulse aspect-square"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {parents.map((cat) => (
        <Link
          key={cat._id}
          href={`/shop/${cat.slug}`}
          className="group flex flex-col items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container p-6 transition-all hover:shadow-card-hover hover:-translate-y-0.5"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon name={cat.icon} className="text-[28px]" />
          </span>
          <p className="text-center text-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
            {locale === "ar" ? cat.nameAr : cat.nameFr}
          </p>
        </Link>
      ))}
    </div>
  );
}
