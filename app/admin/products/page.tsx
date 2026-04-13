"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDzd } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { ar } from "@/lib/admin-i18n";

export default function AdminProductsPage() {
  const products = useQuery(api.products.list, {});
  const remove = useMutation(api.products.remove);

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter">
          {ar.productsList.title}
        </h1>
        <Link href="/admin/products/new">
          <Button size="sm">{ar.productsList.newProduct}</Button>
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[550px]">
          <thead className="bg-slate-950 text-white text-[10px] tracking-widest">
            <tr>
              <th className="text-start p-4">{ar.productsList.image}</th>
              <th className="text-start p-4">{ar.productsList.name}</th>
              <th className="text-start p-4 hidden md:table-cell">{ar.productsList.brand}</th>
              <th className="text-end p-4">{ar.productsList.price}</th>
              <th className="text-end p-4">{ar.productsList.stock}</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p: any) => (
              <tr key={p._id} className="border-b border-outline-variant hover:bg-surface-container-low">
                <td className="p-4">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">image</span>
                    </div>
                  )}
                </td>
                <td className="p-4 font-bold">{p.nameFr}</td>
                <td className="p-4 hidden md:table-cell text-on-surface-variant">
                  {p.brand}
                </td>
                <td className="p-4 text-end font-bold">{formatDzd(p.priceDzd)}</td>
                <td className="p-4 text-end">
                  <span className={p.stock <= 3 ? "text-error font-bold" : ""}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-4 text-end">
                  <Link
                    href={`/admin/products/${p._id}`}
                    className="text-primary text-xs font-bold me-4"
                  >
                    {ar.productsList.edit}
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(ar.productsList.deleteConfirm)) remove({ id: p._id });
                    }}
                    className="text-error text-xs font-bold"
                  >
                    {ar.productsList.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products?.length === 0 && (
          <div className="p-12 text-center text-on-surface-variant">
            {ar.productsList.noProducts}
          </div>
        )}
      </div>
    </div>
  );
}
