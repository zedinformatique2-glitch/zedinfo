"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link, useRouter } from "@/lib/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/i18n/config";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;

  const hierarchy = useQuery(api.categories.listHierarchy, {});

  // Lock body scroll while drawer open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const links: { href: string; label: string; icon: string }[] = [
    { href: "/shop", label: t("shop"), icon: "storefront" },
    { href: "/configurator", label: t("configurator"), icon: "tune" },
    { href: "/fps-estimator", label: t("fpsEstimator"), icon: "speed" },
    { href: "/support", label: t("support"), icon: "support_agent" },
    { href: "/about", label: t("about"), icon: "info" },
  ];

  const getName = (item: { nameFr: string; nameAr: string }) =>
    locale === "ar" ? item.nameAr : item.nameFr;

  return (
    <>
      <button
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 start-0 z-[61] h-[100dvh] w-[86vw] max-w-sm bg-white lg:hidden flex flex-col shadow-2xl rounded-e-3xl transition-[transform,visibility] duration-300 ease-out ${
          open ? "translate-x-0 visible" : "-translate-x-full rtl:translate-x-full invisible"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        {/* Brand header */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-primary to-primary-container text-white rounded-ee-3xl">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 end-4 p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors backdrop-blur"
            aria-label="Close"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
            Menu
          </div>
          <div className="mt-1 text-xl font-black tracking-tighter">
            ZED INFORMATIQUE
          </div>

          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                setOpen(false);
                setSearchQuery("");
              }
            }}
            className="mt-5 flex items-center gap-3 w-full rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 px-4 py-3 focus-within:bg-white/25 focus-within:ring-white/40 transition-all cursor-text"
          >
            <Icon
              name="search"
              className="text-white/70 text-[20px] shrink-0 leading-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tc("search")}
              className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none border-none p-0"
            />
          </form>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-1">
            {/* Shop link */}
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold uppercase tracking-tight text-on-surface hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon name="storefront" className="text-[20px]" />
              </span>
              <span className="flex-1">{t("shop")}</span>
              <Icon
                name="chevron_right"
                className="text-on-surface-variant group-hover:text-primary rtl:-scale-x-100 transition-transform group-hover:translate-x-0.5"
              />
            </Link>

            {/* Dynamic category hierarchy */}
            {hierarchy?.map((parent) => (
              <div key={parent._id}>
                <button
                  onClick={() =>
                    setExpandedParent(
                      expandedParent === parent._id ? null : parent._id
                    )
                  }
                  className="group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold uppercase tracking-tight text-on-surface hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon name={parent.icon} className="text-[20px]" />
                  </span>
                  <span className="flex-1 text-start">{getName(parent)}</span>
                  <Icon
                    name={expandedParent === parent._id ? "expand_less" : "expand_more"}
                    className="text-on-surface-variant group-hover:text-primary transition-transform"
                  />
                </button>

                {/* Sub-categories */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedParent === parent._id
                      ? "max-h-[800px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="ms-6 space-y-0.5 py-1">
                    {/* "All" link for the parent */}
                    <Link
                      href={`/shop/${parent.slug}`}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon name="grid_view" className="text-[16px]" />
                      </span>
                      <span className="flex-1">
                        {locale === "ar" ? "عرض الكل" : "Tout voir"}
                      </span>
                    </Link>
                    {parent.children.map((child) => (
                      <Link
                        key={child._id}
                        href={`/shop/${child.slug}`}
                        onClick={() => setOpen(false)}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary/70 group-hover:bg-primary group-hover:text-white transition-colors">
                          <Icon name={child.icon} className="text-[16px]" />
                        </span>
                        <span className="flex-1">{getName(child)}</span>
                        <Icon
                          name="chevron_right"
                          className="text-[16px] text-on-surface-variant/50 group-hover:text-primary rtl:-scale-x-100"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Remaining links: configurator, fps, support, about */}
            {links.slice(1).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold uppercase tracking-tight text-on-surface hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon name={l.icon} className="text-[20px]" />
                </span>
                <span className="flex-1">{l.label}</span>
                <Icon
                  name="chevron_right"
                  className="text-on-surface-variant group-hover:text-primary rtl:-scale-x-100 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer CTA */}
        <div className="px-6 py-5 border-t border-outline-variant/60">
          <Link
            href="/configurator"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-[0_8px_20px_-8px_rgba(0,53,208,0.5)] hover:brightness-110 transition-all"
          >
            <Icon name="build" className="text-base" />
            {t("configurator")}
          </Link>
        </div>
      </aside>
    </>
  );
}
