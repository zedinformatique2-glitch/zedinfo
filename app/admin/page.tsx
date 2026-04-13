"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDzd } from "@/lib/format";
import { ar } from "@/lib/admin-i18n";

export default function AdminDashboard() {
  const stats = useQuery(api.admin.dashboard, {});

  const cards = stats
    ? [
        { label: ar.dashboard.totalOrders, value: stats.totalOrders, icon: "receipt_long", color: "from-blue-500 to-blue-600" },
        { label: ar.dashboard.pending, value: stats.pending, icon: "hourglass_empty", color: "from-amber-500 to-amber-600" },
        { label: ar.dashboard.revenue7d, value: formatDzd(stats.revenue7d), icon: "payments", color: "from-green-500 to-green-600" },
        { label: ar.dashboard.revenue30d, value: formatDzd(stats.revenue30d), icon: "trending_up", color: "from-emerald-500 to-emerald-600" },
        { label: ar.dashboard.products, value: stats.totalProducts, icon: "inventory_2", color: "from-purple-500 to-purple-600" },
        { label: ar.dashboard.lowStock, value: stats.lowStock, icon: "warning", color: "from-red-500 to-red-600" },
      ]
    : [];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-4xl font-black tracking-tighter mb-6 md:mb-8">
        {ar.dashboard.title}
      </h1>
      {!stats ? (
        <div className="text-on-surface-variant">{ar.dashboard.loading}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-10">
            {cards.map((c) => (
              <div
                key={c.label}
                className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-4 md:p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all relative overflow-hidden"
              >
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-l ${c.color}`} />
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    {c.icon}
                  </span>
                </div>
                <div className="mt-3 md:mt-6 text-xl md:text-3xl font-black">{c.value}</div>
                <div className="text-xs text-on-surface-variant mt-2 font-bold">
                  {c.label}
                </div>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
            <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
              <div className="p-6 flex items-center justify-between">
                <h2 className="font-black text-lg">{ar.dashboard.recentOrders}</h2>
                <Link href="/admin/orders" className="text-primary text-xs font-bold hover:underline">
                  {ar.dashboard.viewAll}
                </Link>
              </div>
              {stats.recentOrders && stats.recentOrders.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-slate-950 text-white text-[10px] tracking-widest">
                    <tr>
                      <th className="text-start p-3 px-6">{ar.orders.orderNumber}</th>
                      <th className="text-end p-3 px-6">{ar.orders.total}</th>
                      <th className="p-3 px-6">{ar.orders.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((o: any) => (
                      <tr key={o._id} className="border-b border-outline-variant hover:bg-surface-container-low">
                        <td className="p-3 px-6">
                          <Link href={`/admin/orders/${o._id}`} className="font-mono font-bold text-primary text-xs">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="p-3 px-6 text-end font-bold">{formatDzd(o.totalDzd)}</td>
                        <td className="p-3 px-6 text-center">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                            o.status === "delivered" ? "bg-green-100 text-green-800" :
                            o.status === "cancelled" ? "bg-red-100 text-red-800" :
                            "bg-primary/10 text-primary"
                          }`}>
                            {ar.status[o.status] || o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-on-surface-variant">{ar.dashboard.noRecentOrders}</div>
              )}
            </div>

            {/* Low stock alerts */}
            <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-red-500 via-red-400 to-red-500" />
              <div className="p-6 flex items-center justify-between">
                <h2 className="font-black text-lg">{ar.dashboard.lowStockAlerts}</h2>
                <Link href="/admin/products" className="text-primary text-xs font-bold hover:underline">
                  {ar.dashboard.viewAll}
                </Link>
              </div>
              {stats.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                <div className="px-6 pb-6 space-y-3">
                  {stats.lowStockProducts.map((p: any) => (
                    <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 ring-1 ring-red-200/60">
                      <div className="font-bold text-sm">{p.nameFr}</div>
                      <div className="text-red-600 font-black text-sm">{p.stock} {ar.dashboard.units}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-on-surface-variant">{ar.dashboard.noLowStock}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
