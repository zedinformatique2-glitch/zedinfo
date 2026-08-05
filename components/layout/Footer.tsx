import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import type { Locale } from "@/lib/i18n/config";

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tn = await getTranslations({ locale, namespace: "nav" });

  return (
    <footer className="bg-[#f8f9fa] mt-auto">
      <div className="px-5 sm:px-6 lg:px-12 pt-12 pb-8 lg:pt-14 lg:pb-10 w-full max-w-container mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 lg:gap-12">
          {/* Brand */}
          <div className="order-1 lg:order-1">
            <div className="text-base font-bold tracking-tight text-gray-900 mb-1.5">
              Zed Informatique
            </div>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-4">
              {t("tagline")}
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61559966709518"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a
                href="https://www.instagram.com/informatiquezed/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="order-2 lg:order-2">
            <h3 className="text-[13px] text-gray-400 mb-3">
              {locale === "ar" ? "روابط سريعة" : "Quick Links"}
            </h3>
            <ul className="space-y-1.5 text-[13px]">
              <li><Link href="/" className="text-gray-600 hover:text-primary transition-colors">{tn("home")}</Link></li>
              <li><Link href="/shop" className="text-gray-600 hover:text-primary transition-colors">{tn("products")}</Link></li>
              <li><Link href="/configurator" className="text-gray-600 hover:text-primary transition-colors">{tn("buildPc")}</Link></li>
              <li><Link href="/track" className="text-gray-600 hover:text-primary transition-colors">{tn("trackOrder")}</Link></li>
              <li><Link href="/support" className="text-gray-600 hover:text-primary transition-colors">{tn("services")}</Link></li>
              <li><Link href="/support#contact" className="text-gray-600 hover:text-primary transition-colors">{tn("contact")}</Link></li>
              <li><Link href="/return-policy" className="text-gray-600 hover:text-primary transition-colors">{locale === "ar" ? "سياسة الإرجاع" : locale === "en" ? "Return policy" : "Politique de retour"}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="order-4 lg:order-3">
            <h3 className="text-[13px] text-gray-400 mb-3">
              {locale === "ar" ? "الفئات" : "Categories"}
            </h3>
            <ul className="space-y-1.5 text-[13px]">
              <li><Link href="/shop/processors" className="text-gray-600 hover:text-primary transition-colors">{locale === "ar" ? "المكونات الأساسية" : "Core Components"}</Link></li>
              <li><Link href="/shop/desktops" className="text-gray-600 hover:text-primary transition-colors">{locale === "ar" ? "أجهزة سطح المكتب" : "Desktops / PCs"}</Link></li>
              <li><Link href="/shop/laptops" className="text-gray-600 hover:text-primary transition-colors">{locale === "ar" ? "الحواسيب المحمولة" : "Laptops / Notebooks"}</Link></li>
              <li><Link href="/shop/printers" className="text-gray-600 hover:text-primary transition-colors">{locale === "ar" ? "الطابعات والماسحات" : "Printers / Scanners & Supplies"}</Link></li>
              <li><Link href="/shop/accessories" className="text-gray-600 hover:text-primary transition-colors">{locale === "ar" ? "الإكسسوارات" : "Accessories"}</Link></li>
              <li><Link href="/shop/networking" className="text-gray-600 hover:text-primary transition-colors">{locale === "ar" ? "الشبكات" : "Networking"}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="order-3 lg:order-4">
            <h3 className="text-[13px] text-gray-400 mb-3">
              {tn("contact")}
            </h3>
            <ul className="space-y-1.5 text-[13px] text-gray-600">
              <li>
                <a href="tel:+213663287772" className="hover:text-primary transition-colors" dir="ltr">+213 663 28 77 72</a>
              </li>
              <li>
                <a href="mailto:zedinformatique2@gmail.com" className="hover:text-primary transition-colors break-all">zedinformatique2@gmail.com</a>
              </li>
              <li>
                {locale === "ar"
                  ? "مقابل المجلس الشعبي الولائي، الجلفة 17000"
                  : "Face à l'APW, Djelfa 17000, Algérie"}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200">
        <div className="px-5 sm:px-6 lg:px-12 py-4 w-full max-w-container mx-auto text-center">
          <p className="text-gray-400 text-xs">
            © 2026 Zed Informatique. {locale === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            Built by{" "}
            <a
              href="https://sitedz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              SiteDZ
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
