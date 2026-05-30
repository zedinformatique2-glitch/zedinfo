"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

function formatBytes(n?: number) {
  if (!n) return "—";
  if (n < 1024) return `${n} ب`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} ك.ب`;
  return `${(n / (1024 * 1024)).toFixed(1)} م.ب`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("ar-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const STATUS: Record<string, { label: string; cls: string }> = {
  running: { label: "جارية…", cls: "bg-amber-100 text-amber-800" },
  completed: { label: "اكتملت", cls: "bg-emerald-100 text-emerald-800" },
  failed: { label: "فشلت", cls: "bg-red-100 text-red-700" },
};

export default function BackupsPage() {
  const backups = useQuery(api.backup.list);
  const runBackup = useAction(api.backupActions.run);
  const getDownloadUrl = useAction(api.backupActions.downloadUrl);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setError(null);
    setRunning(true);
    try {
      await runBackup({});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  async function handleDownload(prefix: string) {
    try {
      const url = await getDownloadUrl({ prefix });
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter">
            النسخ الاحتياطي
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            نسخة كاملة (المنتجات، الأسعار، الطلبات، الصور…) تُرسَل وتُحفَظ على
            Cloudflare. تُنشأ نسخة احتياطية تلقائية كل ليلة.
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-card transition hover:shadow-card-hover hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <span className="material-symbols-outlined text-xl">
            {running ? "hourglass_top" : "cloud_upload"}
          </span>
          {running ? "جاري الحفظ…" : "احفظ الآن"}
        </button>
      </div>

      {running && (
        <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          النسخ جارٍ الآن. قد تستغرق الصور دقيقة — يمكنك مغادرة الصفحة، ستكمل في
          الخلفية.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-outline-variant/40">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-surface-container text-start text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 font-bold text-start">التاريخ</th>
              <th className="px-4 py-3 font-bold text-start">الحالة</th>
              <th className="px-4 py-3 font-bold text-start">المحتوى</th>
              <th className="px-4 py-3 font-bold text-start">الصور</th>
              <th className="px-4 py-3 font-bold text-start">الحجم</th>
              <th className="px-4 py-3 font-bold text-start">النوع</th>
              <th className="px-4 py-3 font-bold text-end">البيانات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {backups === undefined && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                  جاري التحميل…
                </td>
              </tr>
            )}
            {backups && backups.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                  لا توجد نسخ احتياطية بعد. اضغط على « احفظ الآن ».
                </td>
              </tr>
            )}
            {backups?.map((b) => {
              const st = STATUS[b.status] ?? STATUS.running;
              return (
                <tr key={b._id} className="hover:bg-surface-container-lowest">
                  <td className="px-4 py-3">{formatDate(b.startedAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {b.counts
                      ? `${b.counts.products} منتج · ${b.counts.orders} طلب · ${b.counts.categories} فئة`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {b.imagesTotal !== undefined
                      ? `${b.imagesCopied ?? 0}/${b.imagesTotal}` +
                        (b.imagesFailed ? ` (${b.imagesFailed} فشل)` : "")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {formatBytes((b.dataBytes ?? 0) + (b.imageBytes ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {b.trigger === "cron" ? "تلقائية" : "يدوية"}
                  </td>
                  <td className="px-4 py-3 text-end">
                    {b.status === "completed" ? (
                      <button
                        onClick={() => handleDownload(b.prefix)}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-primary ring-1 ring-primary/30 transition hover:bg-primary/5"
                      >
                        <span className="material-symbols-outlined text-base">
                          download
                        </span>
                        تنزيل
                      </button>
                    ) : b.status === "failed" ? (
                      <span className="text-xs text-red-600" title={b.error}>
                        {b.error?.slice(0, 40) ?? "خطأ"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
