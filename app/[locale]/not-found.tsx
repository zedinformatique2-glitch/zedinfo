import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { buildWhatsAppContactUrl } from "@/lib/whatsapp";
import { SITE_PHONE } from "@/lib/seo";

const DIAG_OK = ["CPU", "RAM", "GPU", "SSD", "PSU"];

const QUICK_LINKS = [
  { href: "/shop", icon: "storefront", label: ["nav", "shop"], desc: "shopDesc" },
  { href: "/configurator", icon: "memory", label: ["nav", "configurator"], desc: "configuratorDesc" },
  { href: "/track", icon: "local_shipping", label: ["nav", "trackOrder"], desc: "trackDesc" },
  { href: "/support", icon: "support_agent", label: ["nav", "support"], desc: "supportDesc" },
] as const;

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "notFound" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const whatsappUrl = buildWhatsAppContactUrl(SITE_PHONE.replace("+", ""), t("whatsappMessage"));

  return (
    <>
      {/* Hero band — full-bleed on purpose; -mt-20/pt-20 tucks it under the fixed header like the home hero */}
      <section className="relative -mt-20 overflow-hidden pt-20 bg-gradient-to-br from-gray-950 via-[#001159] to-primary text-white">
        {/* Circuit-grid backdrop (static) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 end-[-10%] h-[28rem] w-[28rem] rounded-full bg-primary-container/40 blur-3xl"
        />

        <div className="container-zed relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white/80 ring-1 ring-white/20">
              <span className="material-symbols-outlined text-base">error</span>
              {t("eyebrow")}
            </span>

            <p
              aria-hidden="true"
              className="mt-6 font-display text-[6rem] font-black leading-none tracking-tight sm:text-[8rem] lg:text-[10rem] bg-gradient-to-b from-white to-primary-fixed-dim bg-clip-text text-transparent"
              dir="ltr"
            >
              404
            </p>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              {t("subtitle")}
            </p>

            <form action={`/${locale}/shop`} method="get" role="search" className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">{t("searchPlaceholder")}</span>
                <span className="material-symbols-outlined pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
                  search
                </span>
                <input
                  type="search"
                  name="q"
                  required
                  placeholder={t("searchPlaceholder")}
                  className="w-full rounded-xl bg-white py-4 pe-4 ps-12 text-sm text-on-surface shadow-lg outline-none ring-2 ring-transparent placeholder:text-on-surface-variant/70 focus:ring-primary-fixed-dim"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-container px-6 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-[0_8px_24px_-8px_rgba(26,75,255,0.6)] ring-1 ring-white/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
              >
                {t("searchButton")}
              </button>
            </form>

            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
            >
              <span className="material-symbols-outlined text-xl rtl-flip">arrow_back</span>
              {t("backHome")}
            </Link>
          </div>

          {/* POST-style diagnostic panel */}
          <div
            dir="ltr"
            className="hidden rounded-3xl bg-black/40 p-6 font-mono text-sm shadow-2xl ring-1 ring-white/15 backdrop-blur sm:block lg:p-8"
          >
            <div className="mb-5 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-300/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              <span className="ms-3 text-xs uppercase tracking-widest text-white/50">
                ZED BIOS · {t("diagTitle")}
              </span>
            </div>
            <ul className="space-y-2.5">
              {DIAG_OK.map((part) => (
                <li key={part} className="flex items-center gap-3 text-white/70">
                  <span className="w-12 text-white">{part}</span>
                  <span className="flex-1 border-b border-dashed border-white/20" />
                  <span className="text-emerald-400">OK</span>
                </li>
              ))}
              <li className="flex items-center gap-3 pt-2 text-white">
                <span className="w-12">{t("diagPage")}</span>
                <span className="flex-1 border-b border-dashed border-red-400/50" />
                <span className="rounded-lg bg-red-500/20 px-2 py-0.5 font-bold text-red-300 ring-1 ring-red-400/40">
                  404 · {t("diagResult")}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Quick links + help */}
      <section className="bg-surface-container-low py-14 lg:py-20">
        <div className="container-zed">
          <h2 className="mb-8 text-center text-2xl font-black tracking-tight sm:text-3xl">
            {t("quickLinks")}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start gap-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-outline-variant/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <span className="material-symbols-outlined text-2xl">{link.icon}</span>
                </span>
                <span>
                  <span className="block font-bold text-on-surface">{tn(link.label[1])}</span>
                  <span className="mt-0.5 block text-sm text-on-surface-variant">{t(link.desc)}</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-3xl bg-white p-6 shadow-card ring-1 ring-outline-variant/40 sm:flex-row sm:p-8">
            <div className="text-center sm:text-start">
              <p className="text-lg font-bold text-on-surface">{t("helpTitle")}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{t("helpText")}</p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(37,211,102,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105"
            >
              <span className="material-symbols-outlined text-xl">chat</span>
              {t("whatsapp")}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
