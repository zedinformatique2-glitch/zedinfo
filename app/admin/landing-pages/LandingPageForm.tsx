"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Mode = { kind: "new" } | { kind: "edit"; id: Id<"landingPages">; initial: any };

export function LandingPageForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const products = useQuery(api.products.list, {});
  const create = useMutation(api.landingPages.create);
  const update = useMutation(api.landingPages.update);

  const init = mode.kind === "edit" ? mode.initial : null;

  const [slug, setSlug] = useState(init?.slug ?? "");
  const [productId, setProductId] = useState<string>(init?.productId ?? "");
  const [headlineFr, setHeadlineFr] = useState(init?.headlineFr ?? "");
  const [headlineAr, setHeadlineAr] = useState(init?.headlineAr ?? "");
  const [headlineEn, setHeadlineEn] = useState(init?.headlineEn ?? "");
  const [subheadlineFr, setSubheadlineFr] = useState(init?.subheadlineFr ?? "");
  const [subheadlineAr, setSubheadlineAr] = useState(init?.subheadlineAr ?? "");
  const [subheadlineEn, setSubheadlineEn] = useState(init?.subheadlineEn ?? "");

  const [bulletTitlesFr, setBulletTitlesFr] = useState<string>((init?.bulletTitlesFr ?? []).join("\n"));
  const [bulletTitlesAr, setBulletTitlesAr] = useState<string>((init?.bulletTitlesAr ?? []).join("\n"));
  const [bulletTitlesEn, setBulletTitlesEn] = useState<string>((init?.bulletTitlesEn ?? []).join("\n"));
  const [bulletsFr, setBulletsFr] = useState<string>((init?.bulletsFr ?? []).join("\n"));
  const [bulletsAr, setBulletsAr] = useState<string>((init?.bulletsAr ?? []).join("\n"));
  const [bulletsEn, setBulletsEn] = useState<string>((init?.bulletsEn ?? []).join("\n"));

  const [descriptionFr, setDescriptionFr] = useState(init?.descriptionFr ?? "");
  const [descriptionAr, setDescriptionAr] = useState(init?.descriptionAr ?? "");
  const [descriptionEn, setDescriptionEn] = useState(init?.descriptionEn ?? "");

  const [heroImage, setHeroImage] = useState(init?.heroImage ?? "");
  const [priceOverrideDzd, setPriceOverrideDzd] = useState<string>(
    init?.priceOverrideDzd != null ? String(init.priceOverrideDzd) : ""
  );
  const [comparePriceDzd, setComparePriceDzd] = useState<string>(
    init?.comparePriceDzd != null ? String(init.comparePriceDzd) : ""
  );
  const [ctaFr, setCtaFr] = useState(init?.ctaFr ?? "Commander maintenant");
  const [ctaAr, setCtaAr] = useState(init?.ctaAr ?? "اطلب الآن");
  const [ctaEn, setCtaEn] = useState(init?.ctaEn ?? "Order now");

  const [urgencyTextFr, setUrgencyTextFr] = useState(init?.urgencyTextFr ?? "");
  const [urgencyTextAr, setUrgencyTextAr] = useState(init?.urgencyTextAr ?? "");
  const [urgencyTextEn, setUrgencyTextEn] = useState(init?.urgencyTextEn ?? "");

  const [guaranteeTextFr, setGuaranteeTextFr] = useState(init?.guaranteeTextFr ?? "");
  const [guaranteeTextAr, setGuaranteeTextAr] = useState(init?.guaranteeTextAr ?? "");
  const [guaranteeTextEn, setGuaranteeTextEn] = useState(init?.guaranteeTextEn ?? "");

  const [scarcityTextFr, setScarcityTextFr] = useState(init?.scarcityTextFr ?? "");
  const [scarcityTextAr, setScarcityTextAr] = useState(init?.scarcityTextAr ?? "");
  const [scarcityTextEn, setScarcityTextEn] = useState(init?.scarcityTextEn ?? "");

  const [primaryColor, setPrimaryColor] = useState(init?.primaryColor ?? "#0035d0");
  const [accentColor, setAccentColor] = useState(init?.accentColor ?? "#ef4444");
  const [backgroundColor, setBackgroundColor] = useState(init?.backgroundColor ?? "#ffffff");
  const [textColor, setTextColor] = useState(init?.textColor ?? "#0a0a0a");
  const [defaultLang, setDefaultLang] = useState<string>(init?.defaultLang ?? "ar");

  const [showCountdown, setShowCountdown] = useState<boolean>(init?.showCountdown ?? false);
  const [countdownEndsAt, setCountdownEndsAt] = useState<string>(
    init?.countdownEndsAt ? new Date(init.countdownEndsAt).toISOString().slice(0, 16) : ""
  );
  const [showStockUrgency, setShowStockUrgency] = useState<boolean>(init?.showStockUrgency ?? true);
  const [enabled, setEnabled] = useState<boolean>(init?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const splitLines = (s: string) => s.split("\n").map((v) => v.trim()).filter(Boolean);
  const optArr = (s: string) => {
    const a = splitLines(s);
    return a.length ? a : undefined;
  };
  const optStr = (s: string) => (s.trim() ? s : undefined);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!productId) {
      setError("اختر منتجًا");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        productId: productId as Id<"products">,
        headlineFr,
        headlineAr,
        headlineEn: optStr(headlineEn),
        subheadlineFr,
        subheadlineAr,
        subheadlineEn: optStr(subheadlineEn),
        bulletsFr: splitLines(bulletsFr),
        bulletsAr: splitLines(bulletsAr),
        bulletsEn: optArr(bulletsEn),
        bulletTitlesFr: optArr(bulletTitlesFr),
        bulletTitlesAr: optArr(bulletTitlesAr),
        bulletTitlesEn: optArr(bulletTitlesEn),
        descriptionFr: optStr(descriptionFr),
        descriptionAr: optStr(descriptionAr),
        descriptionEn: optStr(descriptionEn),
        heroImage: heroImage.trim() || undefined,
        priceOverrideDzd: priceOverrideDzd ? Number(priceOverrideDzd) : undefined,
        comparePriceDzd: comparePriceDzd ? Number(comparePriceDzd) : undefined,
        ctaFr,
        ctaAr,
        ctaEn: optStr(ctaEn),
        urgencyTextFr: optStr(urgencyTextFr),
        urgencyTextAr: optStr(urgencyTextAr),
        urgencyTextEn: optStr(urgencyTextEn),
        guaranteeTextFr: optStr(guaranteeTextFr),
        guaranteeTextAr: optStr(guaranteeTextAr),
        guaranteeTextEn: optStr(guaranteeTextEn),
        scarcityTextFr: optStr(scarcityTextFr),
        scarcityTextAr: optStr(scarcityTextAr),
        scarcityTextEn: optStr(scarcityTextEn),
        primaryColor: optStr(primaryColor),
        accentColor: optStr(accentColor),
        backgroundColor: optStr(backgroundColor),
        textColor: optStr(textColor),
        defaultLang: optStr(defaultLang),
        showCountdown,
        countdownEndsAt: showCountdown && countdownEndsAt ? new Date(countdownEndsAt).getTime() : undefined,
        showStockUrgency,
        enabled,
      };
      if (mode.kind === "new") {
        await create(payload);
      } else {
        await update({ id: mode.id, ...payload });
      }
      router.push("/admin/landing-pages");
    } catch (err: any) {
      setError(err.message || "خطأ");
      setSaving(false);
    }
  }

  const selected = products?.find((p: any) => p._id === productId);

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="bg-red-50 ring-1 ring-red-200 text-red-700 p-3 rounded-xl text-sm font-bold">{error}</div>
      )}

      <Section title="المنتج والرابط">
        <Field label="المنتج">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
            required
          >
            <option value="">— اختر منتجًا —</option>
            {products?.map((p: any) => (
              <option key={p._id} value={p._id}>
                {p.nameFr}
              </option>
            ))}
          </select>
        </Field>
        <Field label="الرابط (slug)">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="promo-rtx-4070"
            className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm ltr"
            dir="ltr"
            required
          />
          <div className="text-xs text-on-surface-variant mt-1 ltr">→ /lp/{slug || "..."}</div>
        </Field>
        <Field label="اللغة الافتراضية">
          <select
            value={defaultLang}
            onChange={(e) => setDefaultLang(e.target.value)}
            className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
          >
            <option value="ar">العربية</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </Field>
      </Section>

      <Section title="العناوين (FR / AR / EN)">
        <Field label="العنوان الرئيسي — عربي">
          <input value={headlineAr} onChange={(e) => setHeadlineAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" required />
        </Field>
        <Field label="العنوان الرئيسي — فرنسي">
          <input value={headlineFr} onChange={(e) => setHeadlineFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" required />
        </Field>
        <Field label="Headline — English (اختياري)">
          <input value={headlineEn} onChange={(e) => setHeadlineEn(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" />
        </Field>
        <Field label="وصف قصير — عربي">
          <input value={subheadlineAr} onChange={(e) => setSubheadlineAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
        </Field>
        <Field label="وصف قصير — فرنسي">
          <input value={subheadlineFr} onChange={(e) => setSubheadlineFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" />
        </Field>
        <Field label="Subheadline — English">
          <input value={subheadlineEn} onChange={(e) => setSubheadlineEn(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" />
        </Field>
      </Section>

      <Section title="المزايا / Benefits (سطر لكل نقطة — عناوين ووصف متوازيان)">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="عناوين المزايا — عربي">
            <textarea rows={5} value={bulletTitlesAr} onChange={(e) => setBulletTitlesAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" placeholder={"جودة أصلية\nتوصيل سريع\nضمان حقيقي"} />
          </Field>
          <Field label="وصف المزايا — عربي">
            <textarea rows={5} value={bulletsAr} onChange={(e) => setBulletsAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" placeholder={"منتج أصلي 100% بضمان الشركة\nتوصيل خلال 48 ساعة لجميع الولايات\nضمان سنتين كاملتين"} />
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Titres — Français">
            <textarea rows={5} dir="ltr" value={bulletTitlesFr} onChange={(e) => setBulletTitlesFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
          </Field>
          <Field label="Descriptions — Français">
            <textarea rows={5} dir="ltr" value={bulletsFr} onChange={(e) => setBulletsFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Titles — English">
            <textarea rows={5} dir="ltr" value={bulletTitlesEn} onChange={(e) => setBulletTitlesEn(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
          </Field>
          <Field label="Descriptions — English">
            <textarea rows={5} dir="ltr" value={bulletsEn} onChange={(e) => setBulletsEn(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
          </Field>
        </div>
      </Section>

      <Section title="وصف المنتج الكامل (فقرات، سطر فارغ لفصل الفقرات)">
        <Field label="الوصف — عربي">
          <textarea rows={6} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
        </Field>
        <Field label="Description — Français">
          <textarea rows={6} dir="ltr" value={descriptionFr} onChange={(e) => setDescriptionFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
        </Field>
        <Field label="Description — English">
          <textarea rows={6} dir="ltr" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
        </Field>
      </Section>

      <Section title="الصورة والسعر">
        <Field label="صورة مخصصة (اختياري — اتركها فارغة لاستخدام صور المنتج)">
          <input value={heroImage} onChange={(e) => setHeroImage(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" placeholder="https://..." />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="سعر ترويجي (DZD) — اختياري">
            <input type="number" value={priceOverrideDzd} onChange={(e) => setPriceOverrideDzd(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" placeholder={selected ? String(selected.priceDzd) : ""} />
          </Field>
          <Field label="السعر الأصلي للمقارنة (DZD)">
            <input type="number" value={comparePriceDzd} onChange={(e) => setComparePriceDzd(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" />
          </Field>
        </div>
      </Section>

      <Section title="زر الدعوة للإجراء (CTA)">
        <Field label="نص الزر — عربي">
          <input value={ctaAr} onChange={(e) => setCtaAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
        </Field>
        <Field label="نص الزر — فرنسي">
          <input value={ctaFr} onChange={(e) => setCtaFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" />
        </Field>
        <Field label="CTA — English">
          <input value={ctaEn} onChange={(e) => setCtaEn(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" />
        </Field>
      </Section>

      <Section title="نصوص الإلحاح والضمان والندرة">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="نص الإلحاح — عربي">
            <input value={urgencyTextAr} onChange={(e) => setUrgencyTextAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" placeholder="عرض محدود" />
          </Field>
          <Field label="Urgence — FR">
            <input dir="ltr" value={urgencyTextFr} onChange={(e) => setUrgencyTextFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" placeholder="Offre limitée" />
          </Field>
          <Field label="Urgency — EN">
            <input dir="ltr" value={urgencyTextEn} onChange={(e) => setUrgencyTextEn(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" placeholder="Limited offer" />
          </Field>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="ضمان — عربي">
            <input value={guaranteeTextAr} onChange={(e) => setGuaranteeTextAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" placeholder="ضمان سنتين" />
          </Field>
          <Field label="Garantie — FR">
            <input dir="ltr" value={guaranteeTextFr} onChange={(e) => setGuaranteeTextFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
          </Field>
          <Field label="Guarantee — EN">
            <input dir="ltr" value={guaranteeTextEn} onChange={(e) => setGuaranteeTextEn(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
          </Field>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="ندرة — عربي">
            <input value={scarcityTextAr} onChange={(e) => setScarcityTextAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
          </Field>
          <Field label="Rareté — FR">
            <input dir="ltr" value={scarcityTextFr} onChange={(e) => setScarcityTextFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
          </Field>
          <Field label="Scarcity — EN">
            <input dir="ltr" value={scarcityTextEn} onChange={(e) => setScarcityTextEn(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
          </Field>
        </div>
      </Section>

      <Section title="الألوان / Design tokens">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorField label="Primary" value={primaryColor} onChange={setPrimaryColor} />
          <ColorField label="Accent" value={accentColor} onChange={setAccentColor} />
          <ColorField label="Background" value={backgroundColor} onChange={setBackgroundColor} />
          <ColorField label="Text" value={textColor} onChange={setTextColor} />
        </div>
      </Section>

      <Section title="الإلحاح والحالة">
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={showCountdown} onChange={(e) => setShowCountdown(e.target.checked)} />
          إظهار عداد تنازلي
        </label>
        {showCountdown && (
          <Field label="ينتهي في">
            <input type="datetime-local" value={countdownEndsAt} onChange={(e) => setCountdownEndsAt(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" />
          </Field>
        )}
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={showStockUrgency} onChange={(e) => setShowStockUrgency(e.target.checked)} />
          إظهار تحذير "الكمية محدودة"
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          الصفحة مفعّلة (متاحة للزوار)
        </label>
      </Section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:shadow-lg disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : mode.kind === "new" ? "إنشاء الصفحة" : "حفظ التغييرات"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/landing-pages")}
          className="px-6 py-3 rounded-xl bg-surface-container text-on-surface font-bold text-sm"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6">
      <h2 className="font-black text-sm mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-bold mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs font-bold mb-1.5">{label}</div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-lg border border-outline-variant cursor-pointer"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir="ltr"
          className="flex-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-mono"
        />
      </div>
    </label>
  );
}
