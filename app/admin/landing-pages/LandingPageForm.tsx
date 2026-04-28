"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Mode = { kind: "new" } | { kind: "edit"; id: Id<"landingPages">; initial: any };

export function LandingPageForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const products = useQuery(api.products.list, {});
  const categories = useQuery(api.categories.list, {});
  const [productSearch, setProductSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const create = useMutation(api.landingPages.create);
  const update = useMutation(api.landingPages.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getUrlFromId = useMutation(api.storage.getUrlFromId);

  const init = mode.kind === "edit" ? mode.initial : null;

  // Simple mode: single Arabic input per concept (mirrored to FR on save).
  // Pre-fill from AR if available, otherwise FR (so editing existing works).
  const pickInit = (ar?: string, fr?: string) => ar || fr || "";
  const pickInitArr = (ar?: string[], fr?: string[]) => (ar?.length ? ar : fr || []);

  const [productId, setProductId] = useState<string>(init?.productId ?? "");
  const [slug, setSlug] = useState(init?.slug ?? "");

  const [headline, setHeadline] = useState(pickInit(init?.headlineAr, init?.headlineFr));
  const [subheadline, setSubheadline] = useState(pickInit(init?.subheadlineAr, init?.subheadlineFr));
  const [bullets, setBullets] = useState<string>(pickInitArr(init?.bulletsAr, init?.bulletsFr).join("\n"));
  const [cta, setCta] = useState(pickInit(init?.ctaAr, init?.ctaFr) || "اطلب الآن");

  const [priceOverrideDzd, setPriceOverrideDzd] = useState<string>(
    init?.priceOverrideDzd != null ? String(init.priceOverrideDzd) : ""
  );
  const [comparePriceDzd, setComparePriceDzd] = useState<string>(
    init?.comparePriceDzd != null ? String(init.comparePriceDzd) : ""
  );

  const [enabled, setEnabled] = useState<boolean>(init?.enabled ?? true);

  // Advanced (collapsed by default)
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [heroImage, setHeroImage] = useState(init?.heroImage ?? "");
  const [description, setDescription] = useState(
    pickInit(init?.descriptionAr, init?.descriptionFr)
  );
  const [urgency, setUrgency] = useState(pickInit(init?.urgencyTextAr, init?.urgencyTextFr));
  const [guarantee, setGuarantee] = useState(pickInit(init?.guaranteeTextAr, init?.guaranteeTextFr));
  const [scarcity, setScarcity] = useState(pickInit(init?.scarcityTextAr, init?.scarcityTextFr));
  const [defaultLang, setDefaultLang] = useState<string>(init?.defaultLang ?? "ar");
  const [showCountdown, setShowCountdown] = useState<boolean>(init?.showCountdown ?? false);
  const [countdownEndsAt, setCountdownEndsAt] = useState<string>(
    init?.countdownEndsAt ? new Date(init.countdownEndsAt).toISOString().slice(0, 16) : ""
  );
  const [showStockUrgency, setShowStockUrgency] = useState<boolean>(init?.showStockUrgency ?? true);
  const [primaryColor, setPrimaryColor] = useState(init?.primaryColor ?? "#0035d0");
  const [accentColor, setAccentColor] = useState(init?.accentColor ?? "#ef4444");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const splitLines = (s: string) => s.split("\n").map((v) => v.trim()).filter(Boolean);
  const optStr = (s: string) => (s.trim() ? s : undefined);

  const selected = products?.find((p: any) => p._id === productId);

  // Auto-derive slug from product name if admin hasn't typed one
  const autoSlug = () => {
    if (slug.trim()) return slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (selected?.nameFr) {
      return selected.nameFr
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
    }
    return "";
  };

  const finalSlug = autoSlug();
  const slugCheck = useQuery(
    api.landingPages.slugAvailable,
    finalSlug
      ? { slug: finalSlug, excludeId: mode.kind === "edit" ? mode.id : undefined }
      : "skip"
  );
  const slugTaken = slugCheck === false;

  async function onPickFile(file: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("فشل الرفع");
      const { storageId } = await res.json();
      const fileUrl = await getUrlFromId({ storageId });
      if (!fileUrl) throw new Error("فشل الحصول على الرابط");
      setHeroImage(fileUrl);
    } catch (err: any) {
      setError(err.message || "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!productId) {
      setError("اختر منتجًا");
      return;
    }
    if (!headline.trim()) {
      setError("أدخل العنوان الرئيسي");
      return;
    }
    if (!finalSlug) {
      setError("أدخل رابطًا (slug)");
      return;
    }
    if (slugTaken) {
      setError(`الرابط "${finalSlug}" مستخدم بالفعل — اختر رابطًا آخر`);
      return;
    }
    const bulletsList = splitLines(bullets);

    setSaving(true);
    try {
      // Mirror single-language input to both AR + FR backend fields
      const payload = {
        slug: finalSlug,
        productId: productId as Id<"products">,
        headlineFr: headline,
        headlineAr: headline,
        subheadlineFr: subheadline,
        subheadlineAr: subheadline,
        bulletsFr: bulletsList,
        bulletsAr: bulletsList,
        descriptionFr: optStr(description),
        descriptionAr: optStr(description),
        heroImage: heroImage.trim() || undefined,
        priceOverrideDzd: priceOverrideDzd ? Number(priceOverrideDzd) : undefined,
        comparePriceDzd: comparePriceDzd ? Number(comparePriceDzd) : undefined,
        ctaFr: cta,
        ctaAr: cta,
        urgencyTextFr: optStr(urgency),
        urgencyTextAr: optStr(urgency),
        guaranteeTextFr: optStr(guarantee),
        guaranteeTextAr: optStr(guarantee),
        scarcityTextFr: optStr(scarcity),
        scarcityTextAr: optStr(scarcity),
        primaryColor: optStr(primaryColor),
        accentColor: optStr(accentColor),
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
      const msg = String(err?.message || err || "");
      if (msg.includes("Slug already exists")) {
        setError(`الرابط "${finalSlug}" مستخدم بالفعل — اختر رابطًا آخر`);
      } else {
        setError(msg || "خطأ");
      }
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="bg-red-50 ring-1 ring-red-200 text-red-700 p-3 rounded-xl text-sm font-bold">{error}</div>
      )}

      <Section title="الأساسيات">
        <Field label="المنتج">
          <div className="grid sm:grid-cols-2 gap-2 mb-2">
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
            >
              <option value="">كل الفئات</option>
              {categories?.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.nameFr}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="بحث عن منتج..."
              className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
            />
          </div>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
            size={6}
            required
          >
            <option value="">— اختر منتجًا —</option>
            {(() => {
              if (!products || !categories) return null;
              const search = productSearch.trim().toLowerCase();
              const catMap = new Map(categories.map((c: any) => [c._id, c.nameFr]));
              const filtered = (products as any[]).filter((p) => {
                if (filterCategoryId && p.categoryId !== filterCategoryId) return false;
                if (search && !p.nameFr.toLowerCase().includes(search) && !(p.nameAr || "").toLowerCase().includes(search)) return false;
                return true;
              });
              const groups = new Map<string, any[]>();
              filtered.forEach((p) => {
                const label = (catMap.get(p.categoryId) as string) || "—";
                if (!groups.has(label)) groups.set(label, []);
                groups.get(label)!.push(p);
              });
              return Array.from(groups.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([label, items]) => (
                  <optgroup key={label} label={label}>
                    {items.map((p: any) => (
                      <option key={p._id} value={p._id}>
                        {p.nameFr}
                      </option>
                    ))}
                  </optgroup>
                ));
            })()}
          </select>
        </Field>

        <Field label="رابط الصفحة">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={selected?.nameFr ? "اتركه فارغًا للإنشاء التلقائي" : "promo-rtx-4070"}
            className={`w-full rounded-xl border px-3 py-2 text-sm ${slugTaken ? "border-red-400 bg-red-50" : "border-outline-variant"}`}
            dir="ltr"
          />
          <div className="text-xs mt-1 ltr flex items-center gap-1.5" style={{ color: slugTaken ? "#dc2626" : undefined }}>
            <span className="text-on-surface-variant">→ /lp/{finalSlug || "..."}</span>
            {finalSlug && slugTaken && (
              <span className="font-bold">— ⚠ هذا الرابط مستخدم بالفعل</span>
            )}
            {finalSlug && slugCheck === true && (
              <span className="font-bold text-emerald-600">✓ متاح</span>
            )}
          </div>
        </Field>
      </Section>

      <Section title="المحتوى">
        <Field label="العنوان الرئيسي">
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
            placeholder="أقوى عرض على RTX 4070"
            required
          />
        </Field>

        <Field label="وصف قصير (اختياري)">
          <input
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
            placeholder="جودة أصلية وضمان حقيقي"
          />
        </Field>

        <Field label="المزايا (سطر لكل ميزة)">
          <textarea
            rows={5}
            value={bullets}
            onChange={(e) => setBullets(e.target.value)}
            className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
            placeholder={"منتج أصلي 100% بضمان الشركة\nتوصيل خلال 48 ساعة لجميع الولايات\nالدفع عند الاستلام"}
          />
        </Field>

        <Field label="نص زر الطلب">
          <input
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
          />
        </Field>
      </Section>

      <Section title="السعر">
        <div className="grid grid-cols-2 gap-4">
          <Field label="سعر العرض (DZD) — اختياري">
            <input
              type="number"
              value={priceOverrideDzd}
              onChange={(e) => setPriceOverrideDzd(e.target.value)}
              className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
              dir="ltr"
              placeholder={selected ? String(selected.priceDzd) : ""}
            />
          </Field>
          <Field label="السعر الأصلي للمقارنة (DZD)">
            <input
              type="number"
              value={comparePriceDzd}
              onChange={(e) => setComparePriceDzd(e.target.value)}
              className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
              dir="ltr"
            />
          </Field>
        </div>
      </Section>

      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6">
        <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          الصفحة مفعّلة (متاحة للزوار)
        </label>
      </div>

      {/* Advanced — collapsed by default */}
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="w-full flex items-center justify-between p-6 text-sm font-black"
        >
          <span>إعدادات متقدمة (اختيارية)</span>
          <span className="material-symbols-outlined text-base">{advancedOpen ? "expand_less" : "expand_more"}</span>
        </button>

        {advancedOpen && (
          <div className="px-6 pb-6 space-y-5 border-t border-outline-variant/40 pt-5">
            <Field label="صورة مخصصة (اتركها فارغة لاستخدام صور المنتج)">
              <div className="flex items-center gap-3">
                {heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImage}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover ring-1 ring-outline-variant/40"
                  />
                )}
                <div className="flex-1 flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onPickFile(f);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
                  >
                    {uploading ? "جارٍ الرفع..." : heroImage ? "تغيير الصورة" : "اختر صورة من جهازك"}
                  </button>
                  {heroImage && (
                    <button
                      type="button"
                      onClick={() => setHeroImage("")}
                      className="px-3 py-2 rounded-xl bg-surface-container text-on-surface text-sm font-bold"
                    >
                      إزالة
                    </button>
                  )}
                </div>
              </div>
            </Field>

            <Field label="وصف طويل (فقرات)">
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
              />
            </Field>

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="نص الإلحاح">
                <input value={urgency} onChange={(e) => setUrgency(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" placeholder="عرض محدود" />
              </Field>
              <Field label="نص الضمان">
                <input value={guarantee} onChange={(e) => setGuarantee(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" placeholder="ضمان سنتين" />
              </Field>
              <Field label="نص الندرة">
                <input value={scarcity} onChange={(e) => setScarcity(e.target.value)} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm" placeholder="الكمية محدودة" />
              </Field>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
              <div />
              <ColorField label="اللون الأساسي" value={primaryColor} onChange={setPrimaryColor} />
              <ColorField label="لون التمييز" value={accentColor} onChange={setAccentColor} />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={showCountdown} onChange={(e) => setShowCountdown(e.target.checked)} />
                إظهار عداد تنازلي
              </label>
              {showCountdown && (
                <Field label="ينتهي في">
                  <input
                    type="datetime-local"
                    value={countdownEndsAt}
                    onChange={(e) => setCountdownEndsAt(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </Field>
              )}
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={showStockUrgency} onChange={(e) => setShowStockUrgency(e.target.checked)} />
                إظهار تحذير "الكمية محدودة"
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || slugTaken}
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
