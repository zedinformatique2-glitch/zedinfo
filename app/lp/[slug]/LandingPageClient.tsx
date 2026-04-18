"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDzd } from "@/lib/format";
import { WILAYAS_BILINGUAL, getShippingCost } from "@/lib/wilayas";

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
  const [address, setAddress] = useState("");

  const createOrder = useMutation(api.orders.create);
  const incView = useMutation(api.landingPages.incrementView);
  const incOrder = useMutation(api.landingPages.incrementOrder);

  const product = page.product;
  const price = page.priceOverrideDzd ?? product.priceDzd;
  const compare = page.comparePriceDzd ?? product.comparePriceDzd;
  const image = page.heroImage || product.images?.[0] || "";
  const images: string[] = [image, ...(product.images?.slice(1, 4) ?? [])].filter(Boolean);

  const isRtl = lang === "ar";
  const t = (fr: string, ar: string) => (lang === "fr" ? fr : ar);

  // Fire ViewContent + mark view once
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

  // Countdown
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
            image: image,
          },
        ],
        shippingDzd: shipping,
        customer: {
          fullName,
          phone,
          wilaya,
          address,
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

  return (
    <div dir={isRtl ? "rtl" : "ltr"} lang={lang} className="min-h-screen bg-white">
      {/* Top strip */}
      <div className="bg-slate-950 text-white text-center py-2 text-xs font-bold tracking-wide">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <span>ZED INFORMATIQUE</span>
          <button
            onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
            className="underline underline-offset-2"
          >
            {lang === "fr" ? "العربية" : "Français"}
          </button>
        </div>
      </div>

      {submitted ? (
        <SuccessCard orderNumber={orderNumber} t={t} />
      ) : (
        <>
          {/* Hero */}
          <section className="bg-gradient-to-b from-slate-50 to-white pt-8 md:pt-12 pb-8">
            <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
              <div>
                {page.showCountdown && remaining && (
                  <div className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-black mb-4">
                    <span className="material-symbols-outlined text-base">schedule</span>
                    {t("Offre expire dans", "العرض ينتهي خلال")}: <span className="font-mono">{remaining}</span>
                  </div>
                )}
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight">
                  {lang === "fr" ? page.headlineFr : page.headlineAr}
                </h1>
                {(page.subheadlineFr || page.subheadlineAr) && (
                  <p className="mt-4 text-lg text-slate-600">
                    {lang === "fr" ? page.subheadlineFr : page.subheadlineAr}
                  </p>
                )}

                <div className="mt-6 flex items-baseline gap-3 flex-wrap">
                  <div className="text-4xl font-black text-primary">{formatDzd(price, lang)}</div>
                  {compare && compare > price && (
                    <>
                      <div className="text-lg text-slate-400 line-through">{formatDzd(compare, lang)}</div>
                      <div className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-black">
                        -{Math.round(((compare - price) / compare) * 100)}%
                      </div>
                    </>
                  )}
                </div>

                {page.showStockUrgency && product.stock > 0 && product.stock < 20 && (
                  <div className="mt-3 text-sm text-red-700 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">local_fire_department</span>
                    {t(`Plus que ${product.stock} en stock !`, `تبقى ${product.stock} قطعة فقط!`)}
                  </div>
                )}

                <a
                  href="#order-form"
                  className="mt-6 inline-block bg-primary text-white font-black px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-lg"
                >
                  {lang === "fr" ? page.ctaFr : page.ctaAr}
                </a>
              </div>

              <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 ring-1 ring-outline-variant/40">
                {image && (
                  <Image
                    src={image}
                    alt={product.nameFr}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-6"
                    priority
                  />
                )}
              </div>
            </div>
          </section>

          {/* Benefits / bullets */}
          {((lang === "fr" ? page.bulletsFr : page.bulletsAr)?.length ?? 0) > 0 && (
            <section className="py-10 bg-white">
              <div className="max-w-4xl mx-auto px-4 grid sm:grid-cols-2 gap-4">
                {(lang === "fr" ? page.bulletsFr : page.bulletsAr).map((b: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 ring-1 ring-outline-variant/40">
                    <span className="material-symbols-outlined text-primary text-2xl shrink-0">check_circle</span>
                    <div className="font-bold text-sm">{b}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gallery */}
          {images.length > 1 && (
            <section className="py-8 bg-slate-50">
              <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-3">
                {images.slice(1).map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-white ring-1 ring-outline-variant/40">
                    <Image src={img} alt="" fill sizes="33vw" className="object-contain p-3" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Order form */}
          <section id="order-form" className="py-12 bg-gradient-to-b from-white to-slate-50">
            <div className="max-w-2xl mx-auto px-4">
              <div className="bg-white rounded-3xl shadow-card ring-1 ring-outline-variant/40 p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">
                  {t("Commander maintenant", "اطلب الآن")}
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  {t("Paiement à la livraison — partout en Algérie", "الدفع عند الاستلام — في جميع ولايات الجزائر")}
                </p>

                {error && (
                  <div className="bg-red-50 ring-1 ring-red-200 text-red-700 p-3 rounded-xl text-sm font-bold mb-4">{error}</div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                  <LabeledInput label={t("Nom complet", "الاسم الكامل")} value={fullName} onChange={setFullName} required />
                  <LabeledInput label={t("Téléphone", "رقم الهاتف")} value={phone} onChange={setPhone} required type="tel" />
                  <div>
                    <div className="text-xs font-bold mb-1.5">{t("Wilaya", "الولاية")}</div>
                    <select
                      value={wilaya}
                      onChange={(e) => setWilaya(e.target.value)}
                      required
                      className="w-full rounded-xl border border-outline-variant px-3 py-3 text-sm"
                    >
                      <option value="">{t("— Choisir —", "— اختر —")}</option>
                      {WILAYAS_BILINGUAL.map((w) => (
                        <option key={w.fr} value={w.fr}>
                          {lang === "fr" ? w.fr : w.ar}
                        </option>
                      ))}
                    </select>
                  </div>
                  <LabeledInput label={t("Adresse", "العنوان")} value={address} onChange={setAddress} required />

                  <div>
                    <div className="text-xs font-bold mb-1.5">{t("Quantité", "الكمية")}</div>
                    <div className="inline-flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                      <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 rounded-lg bg-white font-black">−</button>
                      <div className="w-12 text-center font-black">{qty}</div>
                      <button type="button" onClick={() => setQty(qty + 1)} className="w-10 h-10 rounded-lg bg-white font-black">+</button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-2xl bg-slate-50 ring-1 ring-outline-variant/40 p-4 space-y-1.5 text-sm">
                    <Row label={t("Sous-total", "المجموع الفرعي")} value={formatDzd(subtotal, lang)} />
                    <Row label={t("Livraison", "التوصيل")} value={wilaya ? formatDzd(shipping, lang) : t("Choisir wilaya", "اختر الولاية")} />
                    {savings > 0 && (
                      <Row label={t("Économies", "توفير")} value={`- ${formatDzd(savings, lang)}`} highlight="text-green-700" />
                    )}
                    <div className="pt-2 mt-2 border-t border-outline-variant flex items-center justify-between">
                      <div className="font-black">{t("Total", "المجموع")}</div>
                      <div className="font-black text-lg text-primary">{formatDzd(total, lang)}</div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary text-white font-black py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    {submitting ? "..." : (lang === "fr" ? page.ctaFr : page.ctaAr)}
                  </button>

                  <p className="text-xs text-center text-slate-500">
                    {t("En commandant, vous acceptez nos conditions de vente.", "بتقديم الطلب، أنت توافق على شروط البيع.")}
                  </p>
                </form>
              </div>
            </div>
          </section>

          <footer className="py-6 text-center text-xs text-slate-500">
            © ZED INFORMATIQUE
          </footer>
        </>
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange, required, type = "text" }: any) {
  return (
    <div>
      <div className="text-xs font-bold mb-1.5">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        type={type}
        className="w-full rounded-xl border border-outline-variant px-3 py-3 text-sm"
      />
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
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-card ring-1 ring-outline-variant/40 p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
        </div>
        <h2 className="text-2xl font-black tracking-tighter mb-2">{t("Commande confirmée !", "تم تأكيد الطلب!")}</h2>
        <p className="text-slate-600 text-sm mb-4">
          {t("Nous vous contacterons bientôt pour confirmer votre livraison.", "سنتصل بك قريبًا لتأكيد التوصيل.")}
        </p>
        <div className="bg-slate-50 rounded-2xl p-4 font-mono font-bold text-primary">{orderNumber}</div>
      </div>
    </div>
  );
}
