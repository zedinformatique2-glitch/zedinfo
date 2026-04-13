import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { CartBadge } from "./CartBadge";
import { MobileNav } from "./MobileNav";
import { SearchDropdown } from "./SearchDropdown";
import type { Locale } from "@/lib/i18n/config";

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "nav" });

  const links = [
    { href: "/", label: t("home") },
    { href: "/shop", label: t("products") },
    { href: "/configurator", label: t("buildPc") },
    { href: "/support", label: t("services") },
    { href: "/track", label: t("trackOrder") },
    { href: "/fps-estimator", label: t("fpsEstimator") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav className="flex items-center justify-between h-16 px-4 lg:px-8 w-full">
        {/* Start: hamburger + logo */}
        <div className="flex items-center gap-1">
          <MobileNav />
          <Link
            href="/"
            aria-label="ZED INFORMATIQUE"
            dir="ltr"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Image
              src="/logo.jpg"
              alt="ZED INFORMATIQUE"
              width={40}
              height={40}
              className="rounded-full ring-2 ring-primary/20"
            />
          </Link>
        </div>

        {/* Center: nav links */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="px-3 py-2 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* End: locale, search, cart */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <SearchDropdown />
          <CartBadge />
        </div>
      </nav>
    </header>
  );
}
