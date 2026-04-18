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
  const [subheadlineFr, setSubheadlineFr] = useState(init?.subheadlineFr ?? "");
  const [subheadlineAr, setSubheadlineAr] = useState(init?.subheadlineAr ?? "");
  const [bulletsFr, setBulletsFr] = useState<string>((init?.bulletsFr ?? []).join("\n"));
  const [bulletsAr, setBulletsAr] = useState<string>((init?.bulletsAr ?? []).join("\n"));
  const [heroImage, setHeroImage] = useState(init?.heroImage ?? "");
  const [priceOverrideDzd, setPriceOverrideDzd] = useState<string>(
    init?.priceOverrideDzd != null ? String(init.priceOverrideDzd) : ""
  );
  const [comparePriceDzd, setComparePriceDzd] = useState<string>(
    init?.comparePriceDzd != null ? String(init.comparePriceDzd) : ""
  );
  const [ctaFr, setCtaFr] = useState(init?.ctaFr ?? "Commander maintenant");
  const [ctaAr, setCtaAr] = useState(init?.ctaAr ?? "اطلب الآن");
  const [showCountdown, setShowCountdown] = useState<boolean>(init?.showCountdown ?? false);
  const [countdownEndsAt, setCountdownEndsAt] = useState<string>(
    init?.countdownEndsAt
      ? new Date(init.countdownEndsAt).toISOString().slice(0, 16)
      : ""
  );
  const [showStockUrgency, setShowStockUrgency] = useState<boolean>(init?.showStockUrgency ?? true);
  const [enabled, setEnabled] = useState<boolean>(init?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
        subheadlineFr,
        subheadlineAr,
        bulletsFr: bulletsFr.split("\n").map((s) => s.trim()).filter(Boolean),
        bulletsAr: bulletsAr.split("\n").map((s) => s.trim()).filter(Boolean),
        heroImage: heroImage.trim() || undefined,
        priceOverrideDzd: priceOverrideDzd ? Number(priceOverrideDzd) : undefined,
        comparePriceDzd: comparePriceDzd ? Number(comparePriceDzd) : undefined,
        ctaFr,
        ctaAr,
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
      </Section>

      <Section title="العناوين (FR / AR)">
        <Field label="العنوان الرئيسي — فرنسي">
          <input value={headlineFr} onChange={(e) => setHeadlineFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" required />
        </Field>
        <Field label="العنوان الرئيسي — عربي">
          <input value={headlineAr} onChange={(e) => setHeadlineAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" required />
        </Field>
        <Field label="وصف قصير — فرنسي">
          <input value={subheadlineFr} onChange={(e) => setSubheadlineFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" />
        </Field>
        <Field label="وصف قصير — عربي">
          <input value={subheadlineAr} onChange={(e) => setSubheadlineAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
        </Field>
      </Section>

      <Section title="نقاط البيع (سطر لكل نقطة)">
        <Field label="النقاط — فرنسي">
          <textarea
            rows={5}
            value={bulletsFr}
            onChange={(e) => setBulletsFr(e.target.value)}
            className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
            dir="ltr"
            placeholder={"Livraison 48h partout en Algérie\nGarantie 2 ans\nPaiement à la livraison"}
          />
        </Field>
        <Field label="النقاط — عربي">
          <textarea
            rows={5}
            value={bulletsAr}
            onChange={(e) => setBulletsAr(e.target.value)}
            className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
            placeholder={"توصيل خلال 48 ساعة\nضمان سنتين\nالدفع عند الاستلام"}
          />
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
        <Field label="نص الزر — فرنسي">
          <input value={ctaFr} onChange={(e) => setCtaFr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" dir="ltr" />
        </Field>
        <Field label="نص الزر — عربي">
          <input value={ctaAr} onChange={(e) => setCtaAr(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" />
        </Field>
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
