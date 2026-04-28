"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { WILAYAS_BILINGUAL, getCommunesForWilaya, getShippingCost, getWilayaNumber } from "@/lib/wilayas";
import { isValidDzMobile, normalizeDzPhone, DZ_PHONE_ERROR } from "@/lib/phone";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

type Lang = "ar" | "fr" | "en";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full || "000000", 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
function rgba(hex: string, a: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function isLightColor(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

function formatPrice(n: number, lang: Lang) {
  const locale = lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-DZ" : "en-US";
  return `${n.toLocaleString(locale)} DZD`;
}

export function LandingPageClient({ page }: { page: any }) {
  const defaultLang = (page.defaultLang as Lang) || "ar";
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [deliveryType, setDeliveryType] = useState<"home" | "stopdesk">("home");
  const [stationCode, setStationCode] = useState("");
  const [desks, setDesks] = useState<{ code: string; name: string; address?: string; wilayaId?: number }[]>([]);
  const [dynamicShipping, setDynamicShipping] = useState<number | null>(null);

  const createOrder = useMutation(api.orders.create);
  const incView = useMutation(api.landingPages.incrementView);
  const incOrder = useMutation(api.landingPages.incrementOrder);
  const enabledCarriers = useQuery(api.delivery.getEnabledCarriers);
  const getCarrierFees = useAction(api.delivery.getFees);
  const getCarrierDesks = useAction(api.delivery.getDesks);

  const product = page.product;
  const price = page.priceOverrideDzd ?? product.priceDzd;
  const compare = page.comparePriceDzd ?? product.comparePriceDzd;

  const primaryColor = page.primaryColor || "#0035d0";
  const accentColor = page.accentColor || "#ef4444";
  const backgroundColor = page.backgroundColor || "#ffffff";
  const textColor = page.textColor || "#0a0a0a";
  const isLight = isLightColor(backgroundColor);
  const cardBg = isLight ? "#ffffff" : "#141414";
  const borderColor = isLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.10)";
  const mutedText = isLight ? "rgba(0,0,0,0.50)" : "rgba(255,255,255,0.50)";
  const subtleText = isLight ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.28)";
  const sectionAlt = isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)";

  const heroImg = page.heroImage || product.images?.[0] || "";
  const colorVariants: { hex: string; nameFr?: string; nameAr?: string; image: string }[] =
    product.colorVariants ?? [];
  const gallery: string[] = useMemo(() => {
    const imgs: string[] = [];
    if (heroImg) imgs.push(heroImg);
    (product.images ?? []).forEach((u: string) => {
      if (u && !imgs.includes(u)) imgs.push(u);
    });
    colorVariants.forEach((v) => {
      if (v.image && !imgs.includes(v.image)) imgs.push(v.image);
    });
    return imgs;
  }, [heroImg, product.images, colorVariants]);
  const currentImage = gallery[activeImage] || heroImg;
  const activeColorIndex = colorVariants.findIndex((v) => v.image === currentImage);

  const isRTL = lang === "ar";
  const communes = useMemo(() => (wilaya ? getCommunesForWilaya(wilaya) : []), [wilaya]);

  const pick = (fr?: string, ar?: string, en?: string) => {
    const v = lang === "ar" ? ar : lang === "fr" ? fr : en;
    return v || fr || ar || en || "";
  };
  const pickArr = (fr?: string[], ar?: string[], en?: string[]): string[] => {
    const v = lang === "ar" ? ar : lang === "fr" ? fr : en;
    return (v && v.length ? v : fr || ar || en || []) as string[];
  };

  const headline = pick(page.headlineFr, page.headlineAr, page.headlineEn);
  const subheadline = pick(page.subheadlineFr, page.subheadlineAr, page.subheadlineEn);
  const cta = pick(page.ctaFr, page.ctaAr, page.ctaEn);
  const urgency = pick(page.urgencyTextFr, page.urgencyTextAr, page.urgencyTextEn);
  const guarantee = pick(page.guaranteeTextFr, page.guaranteeTextAr, page.guaranteeTextEn);
  const scarcity = pick(page.scarcityTextFr, page.scarcityTextAr, page.scarcityTextEn);
  const description = pick(page.descriptionFr, page.descriptionAr, page.descriptionEn) || pick(product.descFr, product.descAr, product.descFr);
  const bulletTitles = pickArr(page.bulletTitlesFr, page.bulletTitlesAr, page.bulletTitlesEn);
  const bulletDescs = pickArr(page.bulletsFr, page.bulletsAr, page.bulletsEn);
  const bullets = bulletDescs.map((d, i) => ({ title: bulletTitles[i] || "", description: d }));

  // microcopy defaults
  const tr = (ar: string, fr: string, en: string) => (lang === "ar" ? ar : lang === "fr" ? fr : en);
  const mc = {
    delivery: tr("التوصيل لجميع الولايات", "Livraison dans les 58 wilayas", "Delivery to all 58 wilayas"),
    payment: tr("الدفع عند الاستلام", "Paiement à la livraison", "Cash on delivery"),
    fastShip: tr("شحن سريع 24-48 ساعة", "Expédition 24-48h", "Fast 24-48h shipping"),
    whyTitle: tr("لماذا تختار هذا المنتج", "Pourquoi choisir ce produit", "Why choose this product"),
    detailsTitle: tr("تفاصيل المنتج", "Détails du produit", "Product details"),
    orderTitle: tr("أكمل طلبك", "Finalisez votre commande", "Complete your order"),
    orderSubtitle: tr("املأ الحقول بسرعة", "Remplissez rapidement le formulaire", "Fill in the quick form"),
    name: tr("الاسم الكامل", "Nom complet", "Full name"),
    phone: tr("رقم الهاتف", "Téléphone", "Phone"),
    wilayaL: tr("الولاية", "Wilaya", "Wilaya"),
    communeL: tr("البلدية", "Commune", "Commune"),
    addressL: tr("العنوان (اختياري)", "Adresse (optionnel)", "Address (optional)"),
    qty: tr("الكمية", "Quantité", "Quantity"),
    total: tr("المجموع", "Total", "Total"),
    shipping: tr("التوصيل", "Livraison", "Shipping"),
    subtotal: tr("المجموع الفرعي", "Sous-total", "Subtotal"),
    chooseWilaya: tr("— اختر الولاية —", "— Choisir la wilaya —", "— Choose wilaya —"),
    none: tr("— بدون —", "— Aucune —", "— None —"),
    save: tr("توفّر", "Vous économisez", "You save"),
    confirmed: tr("تم تأكيد الطلب!", "Commande confirmée !", "Order confirmed!"),
    confirmedMsg: tr(
      "سنتصل بك قريبًا لتأكيد التوصيل.",
      "Nous vous contacterons bientôt pour confirmer la livraison.",
      "We will call you shortly to confirm delivery."
    ),
    orderNo: tr("رقم الطلب", "Numéro de commande", "Order number"),
    secured: tr("طلب آمن", "Commande sécurisée", "Secure order"),
    required: tr("يرجى ملء الحقول المطلوبة.", "Veuillez remplir les champs requis.", "Please fill in the required fields."),
    errGeneric: tr("حدث خطأ", "Erreur lors de la commande", "An error occurred"),
    footerRights: tr("جميع الحقوق محفوظة", "Tous droits réservés", "All rights reserved"),
    footerCountry: tr("الجزائر", "Algérie", "Algeria"),
    brandLine: tr("متجر إلكتروني", "Boutique en ligne", "Online store"),
    deliveryType: tr("طريقة التوصيل", "Mode de livraison", "Delivery method"),
    homeDelivery: tr("التوصيل إلى المنزل", "Livraison à domicile", "Home delivery"),
    stopDesk: tr("نقطة استلام (Stop Desk)", "Point de relais (Stop Desk)", "Pickup point (Stop Desk)"),
    station: tr("نقطة الاستلام", "Point de relais", "Relay point"),
    stationPickWilaya: tr("اختر الولاية أولاً", "Choisissez d'abord une wilaya", "Choose a wilaya first"),
    stationNone: tr("لا توجد نقطة استلام في هذه الولاية", "Aucun point de relais dans cette wilaya", "No relay point in this wilaya"),
    stationRequired: tr("يرجى اختيار نقطة استلام", "Veuillez choisir un point de relais", "Please choose a relay point"),
  };

  const defaultApiCarrier = (enabledCarriers ?? []).find((c: any) => c.isDefault && c.hasApi && c.credentials);

  // Load desks once
  useEffect(() => {
    if (!defaultApiCarrier) { setDesks([]); return; }
    let cancelled = false;
    getCarrierDesks({ slug: defaultApiCarrier.slug, credentials: defaultApiCarrier.credentials! })
      .then((res: any) => { if (!cancelled && res.desks) setDesks(res.desks); })
      .catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultApiCarrier?.slug]);

  // Reset station when wilaya/deliveryType changes; fetch live fee
  useEffect(() => {
    setStationCode("");
    setDynamicShipping(null);
    if (!wilaya || !defaultApiCarrier) return;
    const wilayaNum = getWilayaNumber(wilaya);
    if (wilayaNum === 0) return;
    let cancelled = false;
    getCarrierFees({
      slug: defaultApiCarrier.slug,
      credentials: defaultApiCarrier.credentials!,
      fromWilaya: 17,
      toWilaya: wilayaNum,
      stopDesk: deliveryType === "stopdesk",
    }).then((res: any) => {
      if (!cancelled && res.fee > 0) setDynamicShipping(res.fee);
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wilaya, deliveryType, defaultApiCarrier?.slug]);

  const wilayaNumForDesks = wilaya ? getWilayaNumber(wilaya) : 0;
  const desksForWilaya = wilayaNumForDesks ? desks.filter((d) => d.wilayaId === wilayaNumForDesks) : [];

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

  useEffect(() => {
    setCommune("");
  }, [wilaya]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !phone.trim() || !wilaya) {
      setError(mc.required);
      return;
    }
    if (!isValidDzMobile(phone)) {
      setError(DZ_PHONE_ERROR[lang] ?? DZ_PHONE_ERROR.fr);
      return;
    }
    if (deliveryType === "stopdesk" && !stationCode) {
      setError(mc.stationRequired);
      return;
    }
    const normalizedPhone = normalizeDzPhone(phone);
    setSubmitting(true);
    try {
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "InitiateCheckout", {
          content_ids: [product.slug],
          value: price * qty,
          currency: "DZD",
        });
      }
      const shipping = dynamicShipping ?? getShippingCost(wilaya);
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
          phone: normalizedPhone,
          wilaya,
          commune: commune || undefined,
          address: address.trim() || commune || "—",
        },
        paymentMethod: "cod",
        locale: lang === "en" ? "fr" : lang,
        deliveryType,
        stationCode: deliveryType === "stopdesk" ? stationCode : undefined,
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
      setError(err.message || mc.errGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = price * qty;
  const shipping = wilaya ? (dynamicShipping ?? getShippingCost(wilaya)) : 0;
  const total = subtotal + shipping;
  const savings = compare ? (compare - price) * qty : 0;
  const discountPct = compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0;

  const productName = pick(product.nameFr, product.nameAr, product.nameFr);

  const ctaStyle: React.CSSProperties = {
    backgroundColor: accentColor,
    color: "#ffffff",
    boxShadow: `0 10px 30px -10px ${rgba(accentColor, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.18)`,
  };

  const reveals = {
    hero: useReveal<HTMLDivElement>(),
    benefits: useReveal<HTMLDivElement>(),
    desc: useReveal<HTMLDivElement>(),
    form: useReveal<HTMLDivElement>(),
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      lang={lang}
      style={{ backgroundColor, color: textColor, fontFamily: isRTL ? '"Cairo", "Inter", system-ui, sans-serif' : '"Plus Jakarta Sans", "Inter", system-ui, sans-serif' }}
      className="min-h-screen pb-20 lg:pb-0"
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* Branded header */}
      <header
        className="border-b backdrop-blur-md sticky top-0 z-30"
        style={{ backgroundColor: isLight ? "rgba(255,255,255,0.78)" : "rgba(20,20,20,0.78)", borderColor }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.jpg"
              alt="ZED INFORMATIQUE"
              width={32}
              height={32}
              className="rounded-lg object-cover"
            />
            <div className="font-bold tracking-tight text-sm" style={{ color: textColor }}>
              ZED INFORMATIQUE
            </div>
          </div>
          <LangSwitcher lang={lang} setLang={setLang} mutedText={mutedText} borderColor={borderColor} />
        </div>
      </header>

      {submitted ? (
        <SuccessCard orderNumber={orderNumber} mc={mc} cardBg={cardBg} borderColor={borderColor} primaryColor={primaryColor} mutedText={mutedText} />
      ) : (
        <>
          {/* Hero */}
          <section className="relative overflow-hidden">
            {/* Soft background blobs */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(60% 50% at 80% 0%, ${rgba(primaryColor, 0.10)} 0%, transparent 60%), radial-gradient(50% 40% at 0% 100%, ${rgba(accentColor, 0.08)} 0%, transparent 60%)`,
              }}
            />

            <div
              ref={reveals.hero.ref}
              className={`relative max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center transition-all duration-700 ${
                reveals.hero.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              {/* Image */}
              <div className={`${isRTL ? "lg:order-2" : "lg:order-1"} relative`}>
                <div
                  className="relative aspect-square rounded-3xl overflow-hidden"
                  style={{
                    background: isLight
                      ? `linear-gradient(160deg, #ffffff 0%, ${rgba(primaryColor, 0.04)} 100%)`
                      : `linear-gradient(160deg, ${rgba(primaryColor, 0.08)} 0%, rgba(255,255,255,0.02) 100%)`,
                    border: `1px solid ${borderColor}`,
                    boxShadow: `0 20px 50px -20px ${rgba(primaryColor, 0.18)}`,
                  }}
                >
                  {currentImage && (
                    <Image
                      src={currentImage}
                      alt={productName}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain p-6 sm:p-10"
                      priority
                    />
                  )}
                  {discountPct > 0 && (
                    <div
                      className="absolute top-4 end-4 rounded-full px-4 py-2 text-sm font-black tracking-wide"
                      style={{ backgroundColor: accentColor, color: "#ffffff", boxShadow: `0 8px 30px ${rgba(accentColor, 0.45)}` }}
                    >
                      -{discountPct}%
                    </div>
                  )}
                </div>

                {/* Inline thumbnail strip (shows on hero on mobile too) */}
                {gallery.length > 1 && (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {gallery.slice(0, 5).map((img, i) => (
                      <button
                        key={`hero-thumb-${i}`}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        className="relative aspect-square rounded-xl overflow-hidden transition-all"
                        style={{
                          backgroundColor: cardBg,
                          border: `2px solid ${activeImage === i ? accentColor : borderColor}`,
                        }}
                      >
                        <Image src={img} alt="" fill sizes="80px" className="object-contain p-1.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Copy */}
              <div className={`${isRTL ? "lg:order-1" : "lg:order-2"}`}>
                {urgency && (
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] mb-5"
                    style={{ backgroundColor: rgba(accentColor, 0.18), color: accentColor }}
                  >
                    <span className="material-symbols-outlined text-base">local_fire_department</span>
                    {urgency}
                  </div>
                )}

                <h1
                  className="font-black leading-[1.1]"
                  style={{
                    fontFamily: '"Outfit", "Cairo", "Plus Jakarta Sans", sans-serif',
                    fontSize: "clamp(1.75rem, 5vw, 3rem)",
                    letterSpacing: "-0.02em",
                    color: textColor,
                  }}
                >
                  {headline}
                </h1>

                <div
                  className="mt-3 h-[2px] w-4"
                  style={{ background: `linear-gradient(to ${isRTL ? "left" : "right"}, ${accentColor}, transparent)` }}
                />

                {subheadline && (
                  <p className="mt-4 text-base sm:text-lg leading-relaxed" style={{ color: mutedText }}>
                    {subheadline}
                  </p>
                )}

                {page.showCountdown && remaining && (
                  <div
                    className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono font-bold"
                    style={{ backgroundColor: rgba(accentColor, 0.12), color: accentColor, border: `1px solid ${rgba(accentColor, 0.3)}` }}
                  >
                    <span className="material-symbols-outlined text-base">schedule</span>
                    {remaining}
                  </div>
                )}

                {/* Price block */}
                <div
                  className="mt-6 rounded-2xl p-5"
                  style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, boxShadow: `0 1px 2px ${rgba(primaryColor, 0.04)}` }}
                >
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <div className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: primaryColor, letterSpacing: "-0.02em" }}>
                      {formatPrice(price, lang)}
                    </div>
                    {compare && compare > price && (
                      <div className="text-xl line-through" style={{ color: subtleText }}>
                        {formatPrice(compare, lang)}
                      </div>
                    )}
                  </div>
                  {savings > 0 && compare && (
                    <div
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                      style={{ backgroundColor: rgba(accentColor, 0.15), color: accentColor }}
                    >
                      <span className="material-symbols-outlined text-sm">savings</span>
                      {mc.save} {formatPrice(compare - price, lang)}
                    </div>
                  )}
                </div>

                {colorVariants.length > 0 && (
                  <div className="mt-5">
                    <div className="text-xs font-bold uppercase tracking-[0.15em] mb-2.5" style={{ color: mutedText }}>
                      {tr("اللون", "Couleur", "Color")}
                      {activeColorIndex >= 0 && (
                        <span className="ms-2 normal-case tracking-normal" style={{ color: textColor }}>
                          — {pick(colorVariants[activeColorIndex].nameFr, colorVariants[activeColorIndex].nameAr)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {colorVariants.map((v, i) => {
                        const idx = gallery.indexOf(v.image);
                        const isActive = idx === activeImage;
                        return (
                          <button
                            key={`color-${i}`}
                            type="button"
                            onClick={() => idx >= 0 && setActiveImage(idx)}
                            title={pick(v.nameFr, v.nameAr) || v.hex}
                            className="w-9 h-9 rounded-full transition-all"
                            style={{
                              backgroundColor: v.hex,
                              boxShadow: isActive
                                ? `0 0 0 2px ${backgroundColor}, 0 0 0 4px ${accentColor}`
                                : `0 0 0 1px ${borderColor}`,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {page.showStockUrgency && product.stock > 0 && product.stock < 20 && (
                  <div
                    className="mt-4 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2"
                    style={{ backgroundColor: rgba(accentColor, 0.1), color: accentColor, border: `1px solid ${rgba(accentColor, 0.25)}` }}
                  >
                    <span className="material-symbols-outlined text-base">local_fire_department</span>
                    {scarcity || tr(`تبقى ${product.stock} قطعة فقط!`, `Plus que ${product.stock} en stock !`, `Only ${product.stock} left in stock!`)}
                  </div>
                )}

                <a
                  href="#order-form"
                  className="mt-6 inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-lg tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={ctaStyle}
                >
                  <span className="material-symbols-outlined">shopping_cart</span>
                  {cta}
                </a>

                {guarantee && (
                  <div className="mt-4 text-xs font-medium flex items-center gap-1.5" style={{ color: mutedText }}>
                    <span className="material-symbols-outlined text-sm" style={{ color: accentColor }}>verified_user</span>
                    {guarantee}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Trust bar */}
          <section
            className="w-full"
            style={{
              backgroundColor: isLight ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.03)",
              color: textColor,
              borderTop: `1px solid ${borderColor}`,
              borderBottom: `1px solid ${borderColor}`,
            }}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5">
              <TrustBadge label={mc.payment} accent={accentColor} />
              <span className="hidden sm:inline-block w-1 h-1 rounded-full" style={{ backgroundColor: subtleText }} />
              <TrustBadge label={mc.delivery} accent={accentColor} />
              <span className="hidden sm:inline-block w-1 h-1 rounded-full" style={{ backgroundColor: subtleText }} />
              <TrustBadge label={mc.fastShip} accent={accentColor} />
            </div>
          </section>

          {/* Benefits grid */}
          {bullets.length > 0 && (
            <section className="py-16 sm:py-24">
              <div
                ref={reveals.benefits.ref}
                className={`max-w-6xl mx-auto px-4 sm:px-8 transition-all duration-700 ${
                  reveals.benefits.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                <h2
                  className="font-black text-center mb-10"
                  style={{ fontFamily: '"Outfit", "Cairo", sans-serif', fontSize: "clamp(1.5rem, 4vw, 2.25rem)", letterSpacing: "-0.02em" }}
                >
                  {mc.whyTitle}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {bullets.map((b, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl p-6 transition-all duration-700 hover:-translate-y-0.5 ${
                        reveals.benefits.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      }`}
                      style={{
                        backgroundColor: cardBg,
                        border: `1px solid ${borderColor}`,
                        boxShadow: `0 1px 2px ${rgba(primaryColor, 0.03)}`,
                        transitionDelay: `${i * 80}ms`,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: rgba(accentColor, 0.12), color: accentColor }}
                      >
                        <span className="material-symbols-outlined text-[22px]">check</span>
                      </div>
                      {b.title && <div className="font-bold text-base mb-1.5" style={{ color: textColor, letterSpacing: "-0.01em" }}>{b.title}</div>}
                      <div className="text-sm leading-relaxed" style={{ color: mutedText }}>
                        {b.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Gallery + description */}
          <section style={{ backgroundColor: sectionAlt, borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}` }}>
            <div
              ref={reveals.desc.ref}
              className={`max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-start transition-all duration-700 ${
                reveals.desc.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              {/* Full gallery — ALL images */}
              <div className={`${isRTL ? "lg:order-2" : "lg:order-1"}`}>
                <div
                  className="relative aspect-square rounded-2xl overflow-hidden mb-3"
                  style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
                >
                  {currentImage && (
                    <Image src={currentImage} alt={productName} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-6" />
                  )}
                </div>
                {gallery.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {gallery.map((img, i) => (
                      <button
                        key={`gal-${i}`}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        className="relative aspect-square rounded-xl overflow-hidden transition-all"
                        style={{
                          backgroundColor: cardBg,
                          border: `2px solid ${activeImage === i ? accentColor : borderColor}`,
                        }}
                      >
                        <Image src={img} alt="" fill sizes="120px" className="object-contain p-2" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className={`${isRTL ? "lg:order-1" : "lg:order-2"}`}>
                <h2
                  className="font-black mb-3"
                  style={{ fontFamily: '"Outfit", "Cairo", sans-serif', fontSize: "clamp(1.5rem, 4vw, 2.25rem)", letterSpacing: "-0.02em" }}
                >
                  {productName}
                </h2>
                <div
                  className="h-[2px] w-16 mb-5"
                  style={{ background: `linear-gradient(to ${isRTL ? "left" : "right"}, ${accentColor}, transparent)` }}
                />
                {description && (
                  <div className="whitespace-pre-line text-base leading-relaxed" style={{ color: mutedText }}>
                    {description}
                  </div>
                )}
                <a
                  href="#order-form"
                  className="mt-8 inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-lg tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={ctaStyle}
                >
                  <span className="material-symbols-outlined">shopping_cart</span>
                  {cta}
                </a>
              </div>
            </div>
          </section>

          {/* Order form */}
          <section id="order-form" className="relative py-16 sm:py-24 overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 50% 30%, ${rgba(accentColor, 0.12)} 0%, transparent 70%)`,
              }}
            />
            <div
              ref={reveals.form.ref}
              className={`relative max-w-lg mx-auto px-4 sm:px-8 transition-all duration-700 ${
                reveals.form.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, boxShadow: `0 30px 60px -30px ${rgba(primaryColor, 0.25)}` }}>
                <div className="px-6 sm:px-7 pt-7 pb-5" style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] mb-3"
                    style={{ backgroundColor: rgba(primaryColor, 0.08), color: primaryColor }}
                  >
                    <span className="material-symbols-outlined text-sm">lock</span>
                    {mc.secured}
                  </div>
                  <h2
                    className="font-bold"
                    style={{ fontFamily: '"Outfit", "Cairo", sans-serif', fontSize: "clamp(1.4rem, 3.5vw, 1.75rem)", letterSpacing: "-0.02em", color: textColor }}
                  >
                    {mc.orderTitle}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: mutedText }}>{mc.orderSubtitle}</p>
                </div>

                <form onSubmit={onSubmit} className="p-6 sm:p-7 space-y-4">
                  {error && (
                    <div
                      className="p-3 rounded-xl text-sm font-bold"
                      style={{ backgroundColor: rgba(accentColor, 0.12), color: accentColor, border: `1px solid ${rgba(accentColor, 0.3)}` }}
                    >
                      {error}
                    </div>
                  )}

                  <LabeledInput
                    label={mc.name}
                    icon="person"
                    value={fullName}
                    onChange={setFullName}
                    required
                    primaryColor={primaryColor}
                    borderColor={borderColor}
                    isLight={isLight}
                    textColor={textColor}
                  />

                  <LabeledInput
                    label={mc.phone}
                    icon="call"
                    value={phone}
                    onChange={setPhone}
                    required
                    type="tel"
                    dir="ltr"
                    placeholder="0555 12 34 56"
                    primaryColor={primaryColor}
                    borderColor={borderColor}
                    isLight={isLight}
                    textColor={textColor}
                  />

                  <LabeledSelect
                    label={mc.wilayaL}
                    icon="location_on"
                    value={wilaya}
                    onChange={setWilaya}
                    required
                    primaryColor={primaryColor}
                    borderColor={borderColor}
                    isLight={isLight}
                    textColor={textColor}
                  >
                    <option value="">{mc.chooseWilaya}</option>
                    {WILAYAS_BILINGUAL.map((w, i) => (
                      <option key={w.fr} value={w.fr}>
                        {String(i + 1).padStart(2, "0")} — {lang === "ar" ? w.ar : w.fr}
                      </option>
                    ))}
                  </LabeledSelect>

                  {communes.length > 0 && (
                    <LabeledSelect
                      label={mc.communeL}
                      icon="pin_drop"
                      value={commune}
                      onChange={setCommune}
                      primaryColor={primaryColor}
                      borderColor={borderColor}
                      isLight={isLight}
                      textColor={textColor}
                    >
                      <option value="">{mc.none}</option>
                      {communes.map((c) => (
                        <option key={c.fr} value={c.fr}>
                          {lang === "ar" ? c.ar : c.fr}
                        </option>
                      ))}
                    </LabeledSelect>
                  )}

                  <LabeledInput
                    label={mc.addressL}
                    icon="home"
                    value={address}
                    onChange={setAddress}
                    primaryColor={primaryColor}
                    borderColor={borderColor}
                    isLight={isLight}
                    textColor={textColor}
                  />

                  <div>
                    <div className="text-xs font-black mb-1.5">{mc.deliveryType}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { v: "home" as const, label: mc.homeDelivery, icon: "home" },
                        { v: "stopdesk" as const, label: mc.stopDesk, icon: "storefront" },
                      ]).map((opt) => {
                        const checked = deliveryType === opt.v;
                        return (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => setDeliveryType(opt.v)}
                            className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-all"
                            style={{
                              backgroundColor: checked ? rgba(primaryColor, 0.12) : cardBg,
                              border: `2px solid ${checked ? primaryColor : borderColor}`,
                              color: textColor,
                            }}
                          >
                            <span className="material-symbols-outlined text-base" style={{ color: primaryColor }}>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {deliveryType === "stopdesk" && (
                    <LabeledSelect
                      label={mc.station}
                      icon="storefront"
                      value={stationCode}
                      onChange={setStationCode}
                      primaryColor={primaryColor}
                      borderColor={borderColor}
                      isLight={isLight}
                      textColor={textColor}
                      required
                    >
                      <option value="">
                        {!wilaya
                          ? mc.stationPickWilaya
                          : desksForWilaya.length === 0
                            ? mc.stationNone
                            : "—"}
                      </option>
                      {desksForWilaya.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.name}{d.address ? ` — ${d.address}` : ""}
                        </option>
                      ))}
                    </LabeledSelect>
                  )}

                  <div>
                    <div className="text-xs font-black mb-1.5">{mc.qty}</div>
                    <div
                      className="inline-flex items-center rounded-xl p-1"
                      style={{ backgroundColor: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)" }}
                    >
                      <button
                        type="button"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-11 h-11 rounded-lg font-black text-lg transition-all"
                        style={{ backgroundColor: cardBg, color: textColor, border: `1px solid ${borderColor}` }}
                      >
                        −
                      </button>
                      <div className="w-14 text-center font-black text-lg">{qty}</div>
                      <button
                        type="button"
                        onClick={() => setQty(qty + 1)}
                        className="w-11 h-11 rounded-lg font-black text-lg transition-all"
                        style={{ backgroundColor: cardBg, color: textColor, border: `1px solid ${borderColor}` }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-4 space-y-1.5 text-sm"
                    style={{ backgroundColor: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)", border: `1px solid ${borderColor}` }}
                  >
                    <Row label={mc.subtotal} value={formatPrice(subtotal, lang)} mutedText={mutedText} />
                    <Row
                      label={mc.shipping}
                      value={wilaya ? formatPrice(shipping, lang) : mc.chooseWilaya}
                      mutedText={mutedText}
                    />
                    {savings > 0 && (
                      <Row label={mc.save} value={`- ${formatPrice(savings, lang)}`} mutedText={mutedText} highlight={accentColor} />
                    )}
                    <div className="pt-2 mt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${borderColor}` }}>
                      <div className="font-black">{mc.total}</div>
                      <div className="font-black text-xl tracking-tight" style={{ color: primaryColor }}>
                        {formatPrice(total, lang)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-lg tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={ctaStyle}
                  >
                    {submitting ? (
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">shopping_cart_checkout</span>
                        {cta}
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-xs pt-1" style={{ color: mutedText }}>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm" style={{ color: accentColor }}>verified</span>
                      {mc.payment}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm" style={{ color: accentColor }}>lock</span>
                      {mc.secured}
                    </span>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer style={{ borderTop: `1px solid ${borderColor}` }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-wrap items-center justify-center gap-3 text-[10px] tracking-[0.2em] uppercase" style={{ color: mutedText }}>
              <span>© ZED INFORMATIQUE — {mc.footerRights}</span>
              <span className="hidden sm:inline">•</span>
              <span>{mc.delivery}</span>
              <span className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
              <span>{mc.footerCountry}</span>
            </div>
          </footer>

          {/* Sticky mobile CTA */}
          <div
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3"
            style={{ backgroundColor: cardBg, borderTop: `1px solid ${borderColor}`, boxShadow: `0 -8px 30px ${rgba(primaryColor, 0.1)}` }}
          >
            <a
              href="#order-form"
              className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-xl font-bold text-base"
              style={ctaStyle}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">shopping_cart</span>
                {cta}
              </span>
              <span className="tracking-tight">{formatPrice(price, lang)}</span>
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function LangSwitcher({
  lang,
  setLang,
  mutedText,
  borderColor,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  mutedText: string;
  borderColor: string;
}) {
  const langs: { code: Lang; label: string }[] = [
    { code: "ar", label: "AR" },
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
  ];
  return (
    <div className="inline-flex items-center rounded-full p-0.5 text-xs font-bold" style={{ border: `1px solid ${borderColor}` }}>
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className="px-2.5 py-1 rounded-full transition-colors"
          style={
            lang === l.code
              ? { backgroundColor: "currentColor", color: "#ffffff" }
              : { color: mutedText }
          }
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function TrustBadge({ label, accent }: { label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0" style={{ color: accent || "currentColor" }}>
        <path d="M16.5 5.5L8 14L3.5 9.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{label}</span>
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
  primaryColor,
  borderColor,
  isLight,
  textColor,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  icon?: string;
  dir?: string;
  placeholder?: string;
  primaryColor: string;
  borderColor: string;
  isLight: boolean;
  textColor: string;
}) {
  return (
    <label className="block">
      <div className="text-xs font-black mb-1.5 flex items-center gap-1.5">
        {icon && (
          <span className="material-symbols-outlined text-sm" style={{ color: primaryColor }}>
            {icon}
          </span>
        )}
        {label}
        {required && <span style={{ color: primaryColor }}>*</span>}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        type={type}
        dir={dir}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none transition-all"
        style={{
          backgroundColor: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${borderColor}`,
          color: textColor,
        }}
      />
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  required,
  icon,
  children,
  primaryColor,
  borderColor,
  isLight,
  textColor,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  icon?: string;
  children: React.ReactNode;
  primaryColor: string;
  borderColor: string;
  isLight: boolean;
  textColor: string;
}) {
  return (
    <label className="block">
      <div className="text-xs font-black mb-1.5 flex items-center gap-1.5">
        {icon && (
          <span className="material-symbols-outlined text-sm" style={{ color: primaryColor }}>
            {icon}
          </span>
        )}
        {label}
        {required && <span style={{ color: primaryColor }}>*</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none transition-all"
        style={{
          backgroundColor: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${borderColor}`,
          color: textColor,
        }}
      >
        {children}
      </select>
    </label>
  );
}

function Row({
  label,
  value,
  mutedText,
  highlight,
}: {
  label: string;
  value: string;
  mutedText: string;
  highlight?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: mutedText }}>{label}</span>
      <span className="font-bold" style={highlight ? { color: highlight } : undefined}>
        {value}
      </span>
    </div>
  );
}

function SuccessCard({
  orderNumber,
  mc,
  cardBg,
  borderColor,
  primaryColor,
  mutedText,
}: {
  orderNumber: string;
  mc: any;
  cardBg: string;
  borderColor: string;
  primaryColor: string;
  mutedText: string;
}) {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div
        className="max-w-lg w-full rounded-2xl p-8 sm:p-10 text-center"
        style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, boxShadow: `0 25px 60px rgba(0,0,0,0.08)` }}
      >
        <div
          className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: "rgba(34, 197, 94, 0.12)", border: `4px solid rgba(34, 197, 94, 0.18)` }}
        >
          <span className="material-symbols-outlined text-5xl" style={{ color: "#16a34a" }}>check_circle</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight mb-2" style={{ letterSpacing: "-0.02em" }}>
          {mc.confirmed}
        </h2>
        <p className="text-sm mb-5 leading-relaxed" style={{ color: mutedText }}>
          {mc.confirmedMsg}
        </p>
        <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: `1px solid ${borderColor}` }}>
          <div className="text-xs font-bold mb-1" style={{ color: mutedText }}>
            {mc.orderNo}
          </div>
          <div className="font-mono font-black text-lg" style={{ color: primaryColor }}>
            {orderNumber}
          </div>
        </div>
      </div>
    </div>
  );
}
