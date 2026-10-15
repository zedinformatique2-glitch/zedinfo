"use client";

import { useMemo, useState } from "react";
import { formatDzd } from "@/lib/format";

// Product chooser for the landing-page form: picture, price and stock per row,
// filtered by category and search. Once a product is chosen it collapses to a
// summary card with a "change" button.
const MAX_ROWS = 60;

export function ProductPicker({
  products,
  categories,
  value,
  onChange,
}: {
  products: any[] | undefined;
  categories: any[] | undefined;
  value: string;
  onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [open, setOpen] = useState(!value);

  const catName = useMemo(
    () => new Map((categories ?? []).map((c: any) => [c._id, c.nameFr as string])),
    [categories]
  );
  const selected = products?.find((p) => p._id === value);

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => {
        if (categoryId && p.categoryId !== categoryId) return false;
        if (q && !p.nameFr.toLowerCase().includes(q) && !(p.nameAr || "").toLowerCase().includes(q)) return false;
        return true;
      })
      .sort(
        (a, b) =>
          (catName.get(a.categoryId) || "").localeCompare(catName.get(b.categoryId) || "") ||
          a.nameFr.localeCompare(b.nameFr)
      );
  }, [products, search, categoryId, catName]);

  if (!products || !categories) {
    return <div className="text-sm text-on-surface-variant">جارٍ تحميل المنتجات…</div>;
  }

  if (selected && !open) {
    return (
      <div className="flex items-center gap-3 rounded-2xl ring-1 ring-primary/40 bg-primary/5 p-3">
        <Thumb src={selected.images?.[0]} size="w-16 h-16" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm truncate">{selected.nameFr}</div>
          <div className="text-xs text-on-surface-variant">{catName.get(selected.categoryId) || "—"}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-black">{formatDzd(selected.priceDzd)}</span>
            <StockBadge product={selected} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 px-3 py-2 rounded-xl bg-white ring-1 ring-outline-variant text-xs font-bold"
        >
          تغيير
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-2 mb-2">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
        >
          <option value="">كل الفئات</option>
          {categories.map((c: any) => (
            <option key={c._id} value={c._id}>
              {c.nameFr}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث عن منتج..."
          className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
        />
      </div>

      <div className="max-h-80 overflow-y-auto rounded-xl ring-1 ring-outline-variant/60 divide-y divide-outline-variant/40">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-on-surface-variant">لا توجد منتجات مطابقة</div>
        ) : (
          filtered.slice(0, MAX_ROWS).map((p) => {
            const active = p._id === value;
            return (
              <button
                key={p._id}
                type="button"
                onClick={() => {
                  onChange(p._id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 text-start transition-colors ${
                  active ? "bg-primary/10" : "hover:bg-surface-container-low"
                }`}
              >
                <Thumb src={p.images?.[0]} size="w-11 h-11" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{p.nameFr}</div>
                  <div className="text-[11px] text-on-surface-variant">{catName.get(p.categoryId) || "—"}</div>
                </div>
                <div className="shrink-0 text-end">
                  <div className="text-sm font-black whitespace-nowrap">{formatDzd(p.priceDzd)}</div>
                  <StockBadge product={p} />
                </div>
              </button>
            );
          })
        )}
      </div>
      <div className="flex items-center justify-between mt-1.5 text-[11px] text-on-surface-variant">
        <span>
          {filtered.length > MAX_ROWS
            ? `يظهر ${MAX_ROWS} من ${filtered.length} — استعمل البحث لتضييق النتائج`
            : `${filtered.length} منتج`}
        </span>
        {selected && (
          <button type="button" onClick={() => setOpen(false)} className="font-bold text-primary">
            إلغاء
          </button>
        )}
      </div>
    </div>
  );
}

function Thumb({ src, size }: { src?: string; size: string }) {
  return (
    <div
      className={`${size} shrink-0 rounded-xl bg-white ring-1 ring-outline-variant/40 overflow-hidden flex items-center justify-center`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="w-full h-full object-contain p-1" />
      ) : (
        <span className="material-symbols-outlined text-on-surface-variant text-base">image</span>
      )}
    </div>
  );
}

function StockBadge({ product }: { product: any }) {
  if (product.requiresBuild) {
    return (
      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800">
        يُباع ضمن تجميعة فقط
      </span>
    );
  }
  if (!product.stock || product.stock <= 0) {
    return (
      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-100 text-red-700">
        نفد المخزون
      </span>
    );
  }
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg bg-green-100 text-green-800">
      متوفر: {product.stock}
    </span>
  );
}
