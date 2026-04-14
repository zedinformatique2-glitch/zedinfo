"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ar } from "@/lib/admin-i18n";
import type { Id } from "@/convex/_generated/dataModel";

export default function AdminCategoriesPage() {
  const hierarchy = useQuery(api.categories.listHierarchy, {});
  const parents = useQuery(api.categories.listParents, {});
  const create = useMutation(api.categories.create);
  const remove = useMutation(api.categories.remove);

  const [form, setForm] = useState({
    slug: "",
    nameFr: "",
    nameAr: "",
    icon: "category",
    order: 100,
    parentId: "" as string,
  });

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const { parentId, ...rest } = form;
    await create({
      ...rest,
      ...(parentId ? { parentId: parentId as Id<"categories"> } : {}),
    });
    setForm({ slug: "", nameFr: "", nameAr: "", icon: "category", order: 100, parentId: "" });
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-4xl font-black tracking-tighter mb-4 md:mb-8">
        {ar.categoriesList.title}
      </h1>
      <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-white text-[10px] tracking-widest">
              <tr>
                <th className="text-start p-4">{ar.categoriesList.slug}</th>
                <th className="text-start p-4">{ar.categoriesList.nameFr}</th>
                <th className="text-start p-4">{ar.categoriesList.icon}</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {hierarchy?.map((parent: any) => (
                <>
                  {/* Parent row */}
                  <tr key={parent._id} className="border-b border-outline-variant bg-slate-50">
                    <td className="p-4 font-mono text-xs font-bold">{parent.slug}</td>
                    <td className="p-4 font-black">{parent.nameFr}</td>
                    <td className="p-4">
                      <span className="material-symbols-outlined text-primary">
                        {parent.icon}
                      </span>
                    </td>
                    <td className="p-4 text-end">
                      <button
                        onClick={() => {
                          if (confirm(ar.categoriesList.deleteConfirm)) remove({ id: parent._id });
                        }}
                        className="text-error text-xs font-bold"
                      >
                        {ar.categoriesList.delete}
                      </button>
                    </td>
                  </tr>
                  {/* Child rows */}
                  {parent.children?.map((child: any) => (
                    <tr key={child._id} className="border-b border-outline-variant/50">
                      <td className="p-4 ps-8 font-mono text-xs text-on-surface-variant">
                        ↳ {child.slug}
                      </td>
                      <td className="p-4 ps-8 font-semibold text-on-surface-variant">
                        {child.nameFr}
                      </td>
                      <td className="p-4">
                        <span className="material-symbols-outlined text-primary/60 text-[20px]">
                          {child.icon}
                        </span>
                      </td>
                      <td className="p-4 text-end">
                        <button
                          onClick={() => {
                            if (confirm(ar.categoriesList.deleteConfirm)) remove({ id: child._id });
                          }}
                          className="text-error text-xs font-bold"
                        >
                          {ar.categoriesList.delete}
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={onAdd} className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
          <h2 className="font-black tracking-tight">{ar.categoriesList.newCategory}</h2>

          {/* Parent selector */}
          <div>
            <Label>Catégorie parente</Label>
            <select
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            >
              <option value="">— Aucune (catégorie parente) —</option>
              {parents?.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.nameFr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>{ar.categoriesList.slug}</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
              dir="ltr"
            />
          </div>
          <div>
            <Label>{ar.categoriesList.nameFr}</Label>
            <Input
              value={form.nameFr}
              onChange={(e) => setForm({ ...form, nameFr: e.target.value })}
              required
              dir="ltr"
            />
          </div>
          <div>
            <Label>{ar.categoriesList.nameAr}</Label>
            <Input
              value={form.nameAr}
              onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>{ar.categoriesList.iconLabel}</Label>
            <Input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <Label>{ar.categoriesList.order}</Label>
            <Input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              dir="ltr"
            />
          </div>
          <Button type="submit" className="w-full">
            {ar.categoriesList.add}
          </Button>
        </form>
      </div>
    </div>
  );
}
