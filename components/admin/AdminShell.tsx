"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ar } from "@/lib/admin-i18n";

const NAV_ITEMS = [
  { href: "/admin", label: ar.nav.dashboard, icon: "dashboard" },
  { href: "/admin/products", label: ar.nav.products, icon: "inventory_2" },
  { href: "/admin/categories", label: ar.nav.categories, icon: "category" },
  { href: "/admin/orders", label: ar.nav.orders, icon: "receipt_long" },
  { href: "/admin/delivery", label: ar.nav.delivery, icon: "local_shipping" },
  { href: "/admin/promotions", label: ar.nav.promotions, icon: "auto_awesome" },
  { href: "/admin/landing-pages", label: ar.nav.landingPages, icon: "rocket_launch" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface">
      {/* Mobile top bar */}
      <div className="md:hidden bg-slate-950 text-white flex items-center justify-between px-4 py-3 sticky top-0 z-50">
        <div className="text-lg font-black tracking-tighter">ZED ADMIN</div>
        <button onClick={() => setOpen(!open)} className="p-1">
          <span className="material-symbols-outlined text-2xl">
            {open ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile nav overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 top-[52px] z-40 bg-black/50" onClick={() => setOpen(false)}>
          <nav
            className="bg-slate-950 text-white w-64 h-full p-4 space-y-1 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${
                  pathname === l.href ? "bg-slate-800 text-white" : "hover:bg-slate-800"
                }`}
              >
                <span className="material-symbols-outlined text-base">{l.icon}</span>
                {l.label}
              </Link>
            ))}
            <form action="/api/admin/logout" method="POST" className="pt-4 border-t border-slate-800 mt-4">
              <button className="w-full text-start text-sm text-slate-400 hover:text-white font-bold px-4 py-3">
                {ar.nav.logout}
              </button>
            </form>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-950 text-white flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-800">
          <div className="text-lg font-black tracking-tighter">ZED ADMIN</div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${
                pathname === l.href ? "bg-slate-800 text-white" : "hover:bg-slate-800"
              }`}
            >
              <span className="material-symbols-outlined text-base">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/logout" method="POST" className="p-4 border-t border-slate-800">
          <button className="w-full text-start text-sm text-slate-400 hover:text-white font-bold">
            {ar.nav.logout}
          </button>
        </form>
      </aside>

      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  );
}
