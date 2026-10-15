"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDzd } from "@/lib/format";
import { conversionRate } from "@/lib/landing-stats";

export default function LandingPagesAdmin() {
  const pages = useQuery(api.landingPages.list);
  const remove = useMutation(api.landingPages.remove);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = async (p: any) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/lp/${p.slug}`);
      setCopiedId(p._id);
      setTimeout(() => setCopiedId((id) => (id === p._id ? null : id)), 2000);
    } catch {
      window.prompt("انسخ الرابط:", `${window.location.origin}/lp/${p.slug}`);
    }
  };

  const onDelete = (p: any) => {
    if (confirm("حذف هذه الصفحة؟")) remove({ id: p._id });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between gap-3 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter">صفحات الهبوط</h1>
        <Link
          href="/admin/landing-pages/new"
          className="shrink-0 px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:shadow-lg"
        >
          + صفحة جديدة
        </Link>
      </div>

      {!pages ? (
        <div className="text-on-surface-variant">جارٍ التحميل…</div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-10 text-center text-on-surface-variant">
          لا توجد صفحات هبوط بعد. أنشئ واحدة للبدء.
        </div>
      ) : (
        <>
          {/* Phones: one card per page */}
          <div className="md:hidden space-y-3">
            {pages.map((p: any) => (
              <div key={p._id} className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-4">
                <div className="flex items-start gap-3">
                  <Thumb product={p.product} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{p.headlineAr || p.headlineFr}</div>
                    <div className="text-xs text-on-surface-variant truncate">{p.product?.nameFr || "—"}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-bold">{formatDzd(price(p))}</span>
                      <StatusBadge enabled={p.enabled} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <Stat label="المشاهدات" value={String(p.views)} />
                  <Stat label="الطلبات" value={String(p.orders)} tone="green" />
                  <Stat label="التحويل" value={rateText(p)} />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <a href={`/lp/${p.slug}`} target="_blank" rel="noopener" className={mobileBtn}>فتح</a>
                  <button onClick={() => copyLink(p)} className={mobileBtn}>
                    {copiedId === p._id ? "تم ✓" : "نسخ"}
                  </button>
                  <Link href={`/admin/landing-pages/${p._id}`} className={mobileBtn}>تعديل</Link>
                  <button onClick={() => onDelete(p)} className={`${mobileBtn} text-red-600`}>حذف</button>
                </div>
              </div>
            ))}
          </div>

          {/* Tablets and up: table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-950 text-white text-[10px] tracking-widest">
                <tr>
                  <th className="text-start p-3 px-4">الصفحة</th>
                  <th className="text-end p-3 px-4">السعر</th>
                  <th className="text-center p-3 px-4">المشاهدات</th>
                  <th className="text-center p-3 px-4">الطلبات</th>
                  <th className="text-center p-3 px-4">التحويل</th>
                  <th className="text-center p-3 px-4">الحالة</th>
                  <th className="p-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p: any) => (
                  <tr key={p._id} className="border-b border-outline-variant hover:bg-surface-container-low">
                    <td className="p-3 px-4">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <Thumb product={p.product} />
                        <div className="min-w-0">
                          <div className="font-bold truncate max-w-[280px]">{p.headlineAr || p.headlineFr}</div>
                          <div className="text-xs text-on-surface-variant truncate max-w-[280px]">
                            {p.product?.nameFr || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 px-4 text-end font-bold whitespace-nowrap">{formatDzd(price(p))}</td>
                    <td className="p-3 px-4 text-center">{p.views}</td>
                    <td className="p-3 px-4 text-center font-bold text-green-700">{p.orders}</td>
                    <td className="p-3 px-4 text-center font-bold">{rateText(p)}</td>
                    <td className="p-3 px-4 text-center">
                      <StatusBadge enabled={p.enabled} />
                    </td>
                    <td className="p-3 px-4">
                      <div className="flex gap-3 justify-end whitespace-nowrap">
                        <a href={`/lp/${p.slug}`} target="_blank" rel="noopener" className="text-primary text-xs font-bold hover:underline">
                          فتح
                        </a>
                        <button onClick={() => copyLink(p)} className="text-primary text-xs font-bold hover:underline">
                          {copiedId === p._id ? "تم النسخ ✓" : "نسخ الرابط"}
                        </button>
                        <Link href={`/admin/landing-pages/${p._id}`} className="text-primary text-xs font-bold hover:underline">
                          تعديل
                        </Link>
                        <button onClick={() => onDelete(p)} className="text-red-600 text-xs font-bold hover:underline">
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const mobileBtn =
  "flex items-center justify-center rounded-xl bg-surface-container py-2 text-xs font-bold text-primary";

const price = (p: any) => p.priceOverrideDzd ?? p.product?.priceDzd ?? 0;

function rateText(p: any) {
  const r = conversionRate(p.orders, p.views);
  return r === null ? "—" : `${r}%`;
}

function Thumb({ product }: { product: any }) {
  const src = product?.images?.[0];
  return (
    <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-container-low ring-1 ring-outline-variant/40 overflow-hidden flex items-center justify-center">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-contain p-1" />
      ) : (
        <span className="material-symbols-outlined text-on-surface-variant text-base">image</span>
      )}
    </div>
  );
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
        enabled ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"
      }`}
    >
      {enabled ? "مفعّلة" : "معطّلة"}
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <div className="rounded-xl bg-surface-container-low py-2">
      <div className={`font-black ${tone === "green" ? "text-green-700" : ""}`}>{value}</div>
      <div className="text-[10px] text-on-surface-variant font-bold">{label}</div>
    </div>
  );
}
