"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDzd, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ar } from "@/lib/admin-i18n";

const STATUSES = ["pending", "confirmed", "preparing", "shipping", "delivered", "cancelled"] as const;

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<(typeof STATUSES)[number] | "all">("all");
  const orders = useQuery(
    api.orders.listAdmin,
    filter === "all" ? {} : { status: filter }
  );

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-4xl font-black tracking-tighter mb-4 md:mb-8">
        {ar.orders.title}
      </h1>
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
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-slate-950 text-white text-[10px] tracking-widest">
            <tr>
              <th className="text-start p-4">{ar.orders.orderNumber}</th>
              <th className="text-start p-4 hidden md:table-cell">{ar.orders.customer}</th>
              <th className="text-start p-4 hidden lg:table-cell">{ar.orders.date}</th>
              <th className="text-end p-4">{ar.orders.total}</th>
              <th className="p-4">{ar.orders.status}</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o: any) => (
              <tr key={o._id} className="border-b border-outline-variant hover:bg-surface-container-low">
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
                  <Badge variant={o.status === "delivered" ? "success" : o.status === "cancelled" ? "error" : "primary"}>
                    {ar.status[o.status] || o.status}
                  </Badge>
                </td>
              </tr>
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
