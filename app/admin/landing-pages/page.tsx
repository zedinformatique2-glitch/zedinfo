"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDzd } from "@/lib/format";

export default function LandingPagesAdmin() {
  const pages = useQuery(api.landingPages.list);
  const remove = useMutation(api.landingPages.remove);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter">صفحات الهبوط</h1>
        <Link
          href="/admin/landing-pages/new"
          className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:shadow-lg"
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
        <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-white text-[10px] tracking-widest">
              <tr>
                <th className="text-start p-3 px-6">العنوان</th>
                <th className="text-start p-3 px-6">المنتج</th>
                <th className="text-end p-3 px-6">السعر</th>
                <th className="text-center p-3 px-6">المشاهدات</th>
                <th className="text-center p-3 px-6">الطلبات</th>
                <th className="text-center p-3 px-6">الحالة</th>
                <th className="p-3 px-6"></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p: any) => (
                <tr key={p._id} className="border-b border-outline-variant hover:bg-surface-container-low">
                  <td className="p-3 px-6 font-bold">{p.headlineFr}</td>
                  <td className="p-3 px-6 text-on-surface-variant">{p.product?.nameFr || "—"}</td>
                  <td className="p-3 px-6 text-end font-bold">
                    {formatDzd(p.priceOverrideDzd ?? p.product?.priceDzd ?? 0)}
                  </td>
                  <td className="p-3 px-6 text-center">{p.views}</td>
                  <td className="p-3 px-6 text-center font-bold text-green-700">{p.orders}</td>
                  <td className="p-3 px-6 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                        p.enabled ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {p.enabled ? "مفعّلة" : "معطّلة"}
                    </span>
                  </td>
                  <td className="p-3 px-6">
                    <div className="flex gap-2 justify-end flex-wrap">
                      <a
                        href={`/lp/${p.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="text-primary text-xs font-bold hover:underline"
                      >
                        فتح
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/lp/${p.slug}`)}
                        className="text-primary text-xs font-bold hover:underline"
                      >
                        نسخ الرابط
                      </button>
                      <Link
                        href={`/admin/landing-pages/${p._id}`}
                        className="text-primary text-xs font-bold hover:underline"
                      >
                        تعديل
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm("حذف هذه الصفحة؟")) remove({ id: p._id });
                        }}
                        className="text-red-600 text-xs font-bold hover:underline"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
