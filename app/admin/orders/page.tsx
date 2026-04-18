"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDzd, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ar } from "@/lib/admin-i18n";
import type { Id } from "@/convex/_generated/dataModel";

const STATUSES = ["pending", "confirmed", "preparing", "shipping", "delivered", "cancelled"] as const;

function StatusSelect({ orderId, current }: { orderId: Id<"orders">; current: string }) {
  const updateStatus = useMutation(api.orders.updateStatus);

  return (
    <select
      value={current}
      onChange={(e) => updateStatus({ id: orderId, status: e.target.value as any })}
      className={`rounded-xl px-3 py-1.5 text-xs font-bold border-0 ring-1 ring-outline-variant/60 cursor-pointer focus:ring-2 focus:ring-primary/50 focus:outline-none ${
        current === "delivered" ? "bg-green-100 text-green-800" :
        current === "cancelled" ? "bg-red-100 text-red-800" :
        "bg-primary/10 text-primary"
      }`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{ar.status[s]}</option>
      ))}
    </select>
  );
}

function OrderRow({ o }: { o: any }) {
  const [expanded, setExpanded] = useState(false);
  const remove = useMutation(api.orders.remove);
  const phone = o.customer?.phone;
  const cleanPhone = phone?.replace(/\s+/g, "");

  return (
    <>
      <tr className="border-b border-outline-variant hover:bg-surface-container-low">
        <td className="p-4">
          <Link
            href={`/admin/orders/${o._id}`}
            className="font-mono font-bold text-primary"
          >
            {o.orderNumber}
          </Link>
        </td>
        <td className="p-4 hidden md:table-cell">{o.customer.fullName}</td>
        <td className="p-4 hidden lg:table-cell text-xs text-on-surface-variant">
          {formatDateTime(o.createdAt)}
        </td>
        <td className="p-4 text-end font-bold">{formatDzd(o.totalDzd)}</td>
        <td className="p-4 text-center">
          <StatusSelect orderId={o._id} current={o.status} />
        </td>
        <td className="p-4">
          <div className="flex items-center gap-1 justify-end">
            {phone && (
              <>
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  title={ar.orders.phone}
                >
                  <span className="material-symbols-outlined text-lg">call</span>
                </a>
                <a
                  href={`https://wa.me/${cleanPhone.replace(/^\+/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-green-100 text-green-700 transition-colors"
                  title={ar.orderDetail.whatsapp}
                >
                  <span className="material-symbols-outlined text-lg">chat</span>
                </a>
              </>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title={expanded ? ar.orders.hideItems : ar.orders.viewItems}
            >
              <span className="material-symbols-outlined text-lg">
                {expanded ? "expand_less" : "expand_more"}
              </span>
            </button>
            <button
              onClick={() => {
                if (confirm(`حذف الطلب ${o.orderNumber}؟`)) remove({ id: o._id });
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
              title="حذف"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-surface-container-low/50">
          <td colSpan={6} className="px-6 py-3">
            <div className="flex flex-wrap gap-3">
              {o.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 ring-1 ring-outline-variant/30 text-xs">
                  <span className="font-bold">{item.nameFr || item.name}</span>
                  <span className="text-on-surface-variant">×{item.qty}</span>
                  <span className="font-bold">{formatDzd(item.priceDzd)}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<(typeof STATUSES)[number] | "all">("all");
  const orders = useQuery(
    api.orders.listAdmin,
    filter === "all" ? {} : { status: filter }
  );
  const clearByStatuses = useMutation(api.orders.clearByStatuses);
  const [clearing, setClearing] = useState(false);

  async function bulkClear(statuses: ("delivered" | "cancelled")[], label: string) {
    if (!confirm(`حذف جميع الطلبات (${label})؟ لا يمكن التراجع.`)) return;
    setClearing(true);
    try {
      const r = await clearByStatuses({ statuses });
      alert(`تم حذف ${r.deleted} طلبًا`);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter">
          {ar.orders.title}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => bulkClear(["delivered"], "تم التوصيل")}
            disabled={clearing}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-green-50 text-green-800 ring-1 ring-green-200 hover:bg-green-100 disabled:opacity-50"
          >
            مسح "تم التوصيل"
          </button>
          <button
            onClick={() => bulkClear(["cancelled"], "ملغى")}
            disabled={clearing}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-800 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-50"
          >
            مسح "ملغى"
          </button>
          <button
            onClick={() => bulkClear(["delivered", "cancelled"], "تم التوصيل + ملغى")}
            disabled={clearing}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            مسح كل المنتهية
          </button>
        </div>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold ring-1 transition-all ${
              filter === s
                ? "bg-primary text-white ring-primary shadow-card"
                : "bg-white text-on-surface-variant ring-outline-variant/60 hover:ring-primary/40"
            }`}
          >
            {s === "all" ? ar.orders.all : ar.status[s]}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-slate-950 text-white text-[10px] tracking-widest">
            <tr>
              <th className="text-start p-4">{ar.orders.orderNumber}</th>
              <th className="text-start p-4 hidden md:table-cell">{ar.orders.customer}</th>
              <th className="text-start p-4 hidden lg:table-cell">{ar.orders.date}</th>
              <th className="text-end p-4">{ar.orders.total}</th>
              <th className="p-4">{ar.orders.status}</th>
              <th className="p-4 text-end">{ar.orders.quickActions}</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o: any) => (
              <OrderRow key={o._id} o={o} />
            ))}
          </tbody>
        </table>
        {orders?.length === 0 && (
          <div className="p-12 text-center text-on-surface-variant">{ar.orders.noOrders}</div>
        )}
      </div>
    </div>
  );
}
