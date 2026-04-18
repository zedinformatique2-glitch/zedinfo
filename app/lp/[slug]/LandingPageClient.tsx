"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDzd } from "@/lib/format";
import { WILAYAS_BILINGUAL, getCommunesForWilaya, getShippingCost } from "@/lib/wilayas";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

type Lang = "fr" | "ar";

export function LandingPageClient({ page }: { page: any }) {
  const [lang, setLang] = useState<Lang>("fr");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  const createOrder = useMutation(api.orders.create);
  const incView = useMutation(api.landingPages.incrementView);
  const incOrder = useMutation(api.landingPages.incrementOrder);

  const product = page.product;
  const price = page.priceOverrideDzd ?? product.priceDzd;
  const compare = page.comparePriceDzd ?? product.comparePriceDzd;
  const heroImg = page.heroImage || product.images?.[0] || "";
  const gallery: string[] = useMemo(
    () => [heroImg, ...(product.images ?? []).filter((u: string) => u && u !== heroImg)].slice(0, 5),
    [heroImg, product.images]
  );
  const currentImage = gallery[activeImage] || heroImg;

  const communes = useMemo(() => (wilaya ? getCommunesForWilaya(wilaya) : []), [wilaya]);

  const isRtl = lang === "ar";
  const t = (fr: string, ar: string) => (lang === "fr" ? fr : ar);

  useEffect(() => {
    incView({ id: page._id as Id<"landingPages"> });
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_ids: [product.slug],
        content_name: product.nameFr,
        content_type: "product",
        value: price,
        currency: "DZD",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [remaining, setRemaining] = useState<string>("");
  useEffect(() => {
    if (!page.showCountdown || !page.countdownEndsAt) return;
    const tick = () => {
      const diff = page.countdownEndsAt - Date.now();
      if (diff <= 0) {
        setRemaining("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [page.showCountdown, page.countdownEndsAt]);

  // Reset commune when wilaya changes
  useEffect(() => {
    setCommune("");
  }, [wilaya]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim() || !wilaya) {
      setError(t("Veuillez remplir les champs requis.", "يرجى ملء الحقول المطلوبة."));
      return;
    }

    setSubmitting(true);
    try {
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "InitiateCheckout", {
          content_ids: [product.slug],
          value: price * qty,
          currency: "DZD",
        });
      }

      const shipping = getShippingCost(wilaya);
      const res = await createOrder({
        items: [
          {
            productId: product._id,
            slug: product.slug,
            nameFr: product.nameFr,
            nameAr: product.nameAr,
            priceDzd: price,
            qty,
            image: heroImg,
          },
        ],
        shippingDzd: shipping,
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          wilaya,
          commune: commune || undefined,
          address: commune || "—",
        },
        paymentMethod: "cod",
        locale: lang,
      });

      await incOrder({ id: page._id as Id<"landingPages"> });

      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Purchase", {
          content_ids: [product.slug],
          value: price * qty + shipping,
          currency: "DZD",
        });
      }

      setOrderNumber(res.orderNumber);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || t("Erreur lors de la commande", "حدث خطأ"));
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = price * qty;
  const shipping = wilaya ? getShippingCost(wilaya) : 0;
  const total = subtotal + shipping;
  const savings = compare ? (compare - price) * qty : 0;
  const discountPct = compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} lang={lang} className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-slate-950 text-white text-xs font-bold tracking-wide">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">verified</span>
            <span>ZED INFORMATIQUE</span>
          </div>
          <button
            onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">language</span>
            {lang === "fr" ? "العربية" : "Français"}
          </button>
        </div>
      </div>

      {/* Announcement / urgency strip */}
      {(page.showCountdown && remaining) || discountPct > 0 ? (
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-2.5 text-center text-sm font-black">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-3 flex-wrap">
            {discountPct > 0 && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">local_fire_department</span>
                {t(`PROMO -${discountPct}%`, `خصم -${discountPct}%`)}
              </span>
            )}
            {page.showCountdown && remaining && (
              <span className="flex items-center gap-1 font-mono">
                <span className="material-symbols-outlined text-base">schedule</span>
                {remaining}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {submitted ? (
        <SuccessCard orderNumber={orderNumber} t={t} />
      ) : (
        <>
          {/* Hero */}
          <section className="bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Gallery */}
              <div className="order-1">
                <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-outline-variant/40 shadow-card">
                  {currentImage && (
                    <Image
                      src={currentImage}
                      alt={product.nameFr}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain p-8"
                      priority
                    />
                  )}
                  {discountPct > 0 && (
                    <div className="absolute top-4 start-4 bg-red-600 text-white font-black text-lg px-3 py-1.5 rounded-xl shadow-lg">
                      -{discountPct}%
                    </div>
                  )}
                </div>
                {gallery.length > 1 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {gallery.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`relative aspect-square rounded-xl overflow-hidden bg-white ring-2 transition-all ${
                          activeImage === i ? "ring-primary shadow-md" : "ring-outline-variant/40 hover:ring-primary/40"
                        }`}
                      >
                        <Image src={img} alt="" fill sizes="80px" className="object-contain p-1.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Copy */}
              <div className="order-2">
                <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-black mb-3">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  {product.brand || "ZED INFORMATIQUE"}
                </div>

                <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-[1.05]">
                  {lang === "fr" ? page.headlineFr : page.headlineAr}
                </h1>

                {(page.subheadlineFr || page.subheadlineAr) && (
                  <p className="mt-3 text-base md:text-lg text-slate-600 leading-relaxed">
                    {lang === "fr" ? page.subheadlineFr : page.subheadlineAr}
                  </p>
                )}

                {/* Price block */}
                <div className="mt-6 bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 ring-1 ring-outline-variant/40">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <div className="text-4xl md:text-5xl font-black text-primary tracking-tighter">
                      {formatDzd(price, lang)}
                    </div>
                    {compare && compare > price && (
                      <div className="text-xl text-slate-400 line-through">{formatDzd(compare, lang)}</div>
                    )}
                  </div>
                  {savings > 0 && (
                    <div className="mt-1.5 text-sm font-bold text-green-700">
                      {t(`Vous économisez ${formatDzd(compare - price)}`, `توفّر ${formatDzd(compare - price, "ar")}`)}
                    </div>
                  )}
                </div>

                {/* Trust badges */}
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <TrustBadge icon="local_shipping" label={t("Livraison 48h", "توصيل 48 ساعة")} />
                  <TrustBadge icon="payments" label={t("Paiement livraison", "الدفع عند الاستلام")} />
                  <TrustBadge icon="verified_user" label={t("Garantie", "ضمان")} />
                </div>

                {page.showStockUrgency && product.stock > 0 && product.stock < 20 && (
                  <div className="mt-4 bg-amber-50 ring-1 ring-amber-200 text-amber-900 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">local_fire_department</span>
                    {t(`Plus que ${product.stock} en stock !`, `تبقى ${product.stock} قطعة فقط!`)}
                  </div>
                )}

                <a
                  href="#order-form"
                  className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white font-black px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-lg"
                >
                  <span className="material-symbols-outlined">shopping_cart</span>
                  {lang === "fr" ? page.ctaFr : page.ctaAr}
                </a>
              </div>
            </div>
          </section>

          {/* Bullets */}
          {((lang === "fr" ? page.bulletsFr : page.bulletsAr)?.length ?? 0) > 0 && (
            <section className="py-10 md:py-14 bg-slate-50">
              <div className="max-w-5xl mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-center mb-8">
                  {t("Pourquoi choisir ce produit", "لماذا تختار هذا المنتج")}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(lang === "fr" ? page.bulletsFr : page.bulletsAr).map((b: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-5 rounded-2xl bg-white ring-1 ring-outline-variant/40 shadow-sm hover:shadow-card transition-shadow"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary">check</span>
                      </div>
                      <div className="font-bold text-sm leading-relaxed">{b}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Order form */}
          <section id="order-form" className="py-12 md:py-16 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-lg mx-auto px-4">
              <div className="bg-white rounded-3xl shadow-xl ring-1 ring-outline-variant/40 overflow-hidden">
                {/* Form header */}
                <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-6 md:p-7">
                  <div className="flex items-center gap-2 text-xs font-bold opacity-90 mb-1">
                    <span className="material-symbols-outlined text-base">lock</span>
                    {t("Commande sécurisée", "طلب آمن")}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tighter">
                    {t("Finalisez votre commande", "أكمل طلبك")}
                  </h2>
                  <p className="text-xs opacity-90 mt-1">
                    {t("3 champs — 30 secondes", "3 حقول — 30 ثانية")}
                  </p>
                </div>

                <form onSubmit={onSubmit} className="p-6 md:p-7 space-y-4">
                  {error && (
                    <div className="bg-red-50 ring-1 ring-red-200 text-red-700 p-3 rounded-xl text-sm font-bold">
                      {error}
                    </div>
                  )}

                  <LabeledInput
                    label={t("Nom complet", "الاسم الكامل")}
                    icon="person"
                    value={fullName}
                    onChange={setFullName}
                    required
                  />

                  <LabeledInput
                    label={t("Téléphone", "رقم الهاتف")}
                    icon="call"
                    value={phone}
                    onChange={setPhone}
                    required
                    type="tel"
                    dir="ltr"
                    placeholder="0555 12 34 56"
                  />

                  <div>
                    <label className="block">
                      <div className="text-xs font-black mb-1.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                        {t("Wilaya", "الولاية")}
                        <span className="text-red-600">*</span>
                      </div>
                      <select
                        value={wilaya}
                        onChange={(e) => setWilaya(e.target.value)}
                        required
                        className="w-full rounded-xl border border-outline-variant/70 px-4 py-3.5 text-sm font-medium bg-slate-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="">{t("— Choisir la wilaya —", "— اختر الولاية —")}</option>
                        {WILAYAS_BILINGUAL.map((w, i) => (
                          <option key={w.fr} value={w.fr}>
                            {String(i + 1).padStart(2, "0")} — {lang === "fr" ? w.fr : w.ar}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {communes.length > 0 && (
                    <div>
                      <label className="block">
                        <div className="text-xs font-black mb-1.5 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">pin_drop</span>
                          {t("Commune (optionnel)", "البلدية (اختياري)")}
                        </div>
                        <select
                          value={commune}
                          onChange={(e) => setCommune(e.target.value)}
                          className="w-full rounded-xl border border-outline-variant/70 px-4 py-3.5 text-sm font-medium bg-slate-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                          <option value="">{t("— Aucune —", "— بدون —")}</option>
                          {communes.map((c) => (
                            <option key={c.fr} value={c.fr}>
                              {lang === "fr" ? c.fr : c.ar}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <div className="text-xs font-black mb-1.5">{t("Quantité", "الكمية")}</div>
                    <div className="inline-flex items-center bg-slate-100 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-11 h-11 rounded-lg bg-white font-black text-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        −
                      </button>
                      <div className="w-14 text-center font-black text-lg">{qty}</div>
                      <button
                        type="button"
                        onClick={() => setQty(qty + 1)}
                        className="w-11 h-11 rounded-lg bg-white font-black text-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white ring-1 ring-outline-variant/40 p-4 space-y-1.5 text-sm">
                    <Row label={t("Sous-total", "المجموع الفرعي")} value={formatDzd(subtotal, lang)} />
                    <Row
                      label={t("Livraison", "التوصيل")}
                      value={wilaya ? formatDzd(shipping, lang) : t("Choisir wilaya", "اختر الولاية")}
                    />
                    {savings > 0 && (
                      <Row
                        label={t("Économies", "توفير")}
                        value={`- ${formatDzd(savings, lang)}`}
                        highlight="text-green-700"
                      />
                    )}
                    <div className="pt-2 mt-2 border-t border-outline-variant/60 flex items-center justify-between">
                      <div className="font-black">{t("Total", "المجموع")}</div>
                      <div className="font-black text-xl text-primary tracking-tighter">{formatDzd(total, lang)}</div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white font-black py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {submitting ? (
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">shopping_cart_checkout</span>
                        {lang === "fr" ? page.ctaFr : page.ctaAr}
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-green-600">verified</span>
                      {t("Paiement livraison", "الدفع عند الاستلام")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-green-600">lock</span>
                      {t("Données sécurisées", "بيانات آمنة")}
                    </span>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* Sticky mobile CTA */}
          <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] p-3 z-40">
            <a
              href="#order-form"
              className="w-full flex items-center justify-between bg-primary text-white font-black px-5 py-3.5 rounded-2xl shadow-md"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">shopping_cart</span>
                {lang === "fr" ? page.ctaFr : page.ctaAr}
              </span>
              <span className="tracking-tighter">{formatDzd(price, lang)}</span>
            </a>
          </div>

          <footer className="py-8 md:pb-8 pb-24 text-center text-xs text-slate-500">
            © ZED INFORMATIQUE — {t("Tous droits réservés", "جميع الحقوق محفوظة")}
          </footer>
        </>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  required,
  type = "text",
  icon,
  dir,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  icon?: string;
  dir?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs font-black mb-1.5 flex items-center gap-1.5">
        {icon && <span className="material-symbols-outlined text-sm text-primary">{icon}</span>}
        {label}
        {required && <span className="text-red-600">*</span>}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        type={type}
        dir={dir}
        placeholder={placeholder}
        className="w-full rounded-xl border border-outline-variant/70 px-4 py-3.5 text-sm font-medium bg-slate-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </label>
  );
}

function TrustBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-slate-50 ring-1 ring-outline-variant/40">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <div className="text-[10px] font-black text-center leading-tight">{label}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={`font-bold ${highlight ?? ""}`}>{value}</span>
    </div>
  );
}

function SuccessCard({ orderNumber, t }: { orderNumber: string; t: (fr: string, ar: string) => string }) {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl ring-1 ring-outline-variant/40 p-8 md:p-10 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-50 ring-4 ring-green-100 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-5xl text-green-600">check_circle</span>
        </div>
        <h2 className="text-3xl font-black tracking-tighter mb-2">{t("Commande confirmée !", "تم تأكيد الطلب!")}</h2>
        <p className="text-slate-600 text-sm mb-5 leading-relaxed">
          {t(
            "Nous vous contacterons bientôt pour confirmer votre livraison.",
            "سنتصل بك قريبًا لتأكيد التوصيل."
          )}
        </p>
        <div className="bg-gradient-to-br from-slate-50 to-white ring-1 ring-outline-variant/40 rounded-2xl p-4">
          <div className="text-xs font-bold text-slate-500 mb-1">{t("Numéro de commande", "رقم الطلب")}</div>
          <div className="font-mono font-black text-primary text-lg">{orderNumber}</div>
        </div>
      </div>
    </div>
  );
}
