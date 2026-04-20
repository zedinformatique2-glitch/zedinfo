"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ar } from "@/lib/admin-i18n";

type ColorVariant = {
  hex: string;
  nameFr?: string;
  nameAr?: string;
  image: string;
};

type InitialProduct = {
  _id?: string;
  slug: string;
  categoryId?: string;
  brand: string;
  nameFr: string;
  nameAr: string;
  descFr: string;
  descAr: string;
  priceDzd: number;
  stock: number;
  images: string[];
  featured: boolean;
  specs: Record<string, any>;
  colorVariants?: ColorVariant[];
};

export function ProductForm({ initial }: { initial?: InitialProduct }) {
  const router = useRouter();
  const categories = useQuery(api.categories.list, {});
  const create = useMutation(api.products.create);
  const update = useMutation(api.products.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getUrlFromId = useMutation(api.storage.getUrlFromId);

  const [form, setForm] = useState<InitialProduct>(
    initial ?? {
      slug: "",
      categoryId: "",
      brand: "",
      nameFr: "",
      nameAr: "",
      descFr: "",
      descAr: "",
      priceDzd: 0,
      stock: 0,
      images: [],
      featured: false,
      specs: { type: "other" },
    }
  );
  const [uploadedImages, setUploadedImages] = useState<string[]>(form.images);
  const [imagesText, setImagesText] = useState("");
  const [specsText, setSpecsText] = useState(JSON.stringify(form.specs, null, 2));
  const [variants, setVariants] = useState<ColorVariant[]>(initial?.colorVariants ?? []);
  const [variantUploadingIdx, setVariantUploadingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadSingleFile(file: File): Promise<string | null> {
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      const url = await getUrlFromId({ storageId });
      return url || null;
    } catch {
      return null;
    }
  }

  function addVariant() {
    setVariants((v) => [...v, { hex: "#000000", nameFr: "", nameAr: "", image: "" }]);
  }
  function updateVariant(idx: number, patch: Partial<ColorVariant>) {
    setVariants((v) => v.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  }
  function removeVariant(idx: number) {
    setVariants((v) => v.filter((_, i) => i !== idx));
  }
  async function uploadVariantImage(idx: number, file: File) {
    setVariantUploadingIdx(idx);
    const url = await uploadSingleFile(file);
    if (url) updateVariant(idx, { image: url });
    setVariantUploadingIdx(null);
  }

  async function uploadFiles(files: FileList | File[]) {
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await res.json();
        const url = await getUrlFromId({ storageId });
        if (url) newUrls.push(url);
      } catch (e) {
        console.error("Upload failed:", e);
      }
    }
    setUploadedImages((prev) => [...prev, ...newUrls]);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  function removeImage(idx: number) {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const linkImages = imagesText.split("\n").map((s) => s.trim()).filter(Boolean);
      const images = [...uploadedImages, ...linkImages];
      let specs: any = {};
      try {
        specs = JSON.parse(specsText);
      } catch {
        alert(ar.productForm.invalidJson);
        setSaving(false);
        return;
      }
      const cleanVariants = variants
        .filter((v) => v.hex && v.image)
        .map((v) => ({
          hex: v.hex,
          image: v.image,
          nameFr: v.nameFr?.trim() || undefined,
          nameAr: v.nameAr?.trim() || undefined,
        }));
      const colorVariants = cleanVariants.length > 0 ? cleanVariants : [];
      if (initial?._id) {
        await update({
          id: initial._id as any,
          patch: { ...form, images, specs, colorVariants },
        });
      } else {
        await create({
          slug: form.slug,
          categoryId: form.categoryId as any,
          brand: form.brand,
          nameFr: form.nameFr,
          nameAr: form.nameAr,
          descFr: form.descFr,
          descAr: form.descAr,
          priceDzd: form.priceDzd,
          stock: form.stock,
          images,
          featured: form.featured,
          specs,
          colorVariants: cleanVariants.length > 0 ? cleanVariants : undefined,
        });
      }
      router.push("/admin/products");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-4xl">
      <h1 className="text-2xl md:text-4xl font-black tracking-tighter">
        {initial ? ar.productForm.editProduct : ar.productForm.newProduct}
      </h1>

      {/* Basic info */}
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>{ar.productForm.slug}</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>{ar.productForm.brand}</Label>
            <Input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>{ar.productForm.category}</Label>
            <Select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required
            >
              <option value="">{ar.productForm.selectCategory}</option>
              {categories?.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.nameFr}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Names & Descriptions */}
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>{ar.productForm.nameFr}</Label>
            <Input
              value={form.nameFr}
              onChange={(e) => setForm({ ...form, nameFr: e.target.value })}
              required
              dir="ltr"
            />
          </div>
          <div>
            <Label>{ar.productForm.nameAr}</Label>
            <Input
              value={form.nameAr}
              onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>{ar.productForm.descFr}</Label>
            <Textarea
              rows={3}
              value={form.descFr}
              onChange={(e) => setForm({ ...form, descFr: e.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <Label>{ar.productForm.descAr}</Label>
            <Textarea
              rows={3}
              value={form.descAr}
              onChange={(e) => setForm({ ...form, descAr: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>{ar.productForm.price}</Label>
            <Input
              type="number"
              value={form.priceDzd}
              onChange={(e) => setForm({ ...form, priceDzd: Number(e.target.value) })}
              required
              dir="ltr"
            />
          </div>
          <div>
            <Label>{ar.productForm.stock}</Label>
            <Input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              required
              dir="ltr"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              {ar.productForm.featured}
            </label>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
        <Label>{ar.productForm.images}</Label>

        {/* Upload area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-2 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-outline-variant hover:border-primary/40"
          }`}
        >
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2 block">
            cloud_upload
          </span>
          <p className="text-sm text-on-surface-variant">
            {uploading ? ar.productForm.uploading : ar.productForm.dragDrop}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                uploadFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />
        </div>

        {/* Uploaded image previews */}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
            {uploadedImages.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt=""
                  className="w-full aspect-square object-cover rounded-xl ring-1 ring-outline-variant/40"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 end-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Optional manual links */}
        <div className="mt-4">
          <Label>{ar.productForm.orAddLinks}</Label>
          <Textarea
            rows={3}
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            dir="ltr"
          />
        </div>
      </div>

      {/* Color variants */}
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
        <div className="flex items-center justify-between mb-3">
          <div>
            <Label>الألوان المتاحة (اختياري)</Label>
            <p className="text-xs text-on-surface-variant mt-1">
              أضف لونًا واحدًا على الأقل لتفعيل زر تبديل الألوان في صفحة المنتج. اتركه فارغًا لإخفاء الزر.
            </p>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:shadow-md"
          >
            + إضافة لون
          </button>
        </div>

        {variants.length > 0 && (
          <div className="space-y-3 mt-4">
            {variants.map((v, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto_auto] gap-3 items-center p-3 rounded-xl ring-1 ring-outline-variant/40 bg-surface-container-low"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={v.hex}
                    onChange={(e) => updateVariant(idx, { hex: e.target.value })}
                    className="h-10 w-10 rounded-lg border border-outline-variant cursor-pointer"
                  />
                  <input
                    value={v.hex}
                    onChange={(e) => updateVariant(idx, { hex: e.target.value })}
                    dir="ltr"
                    className="w-24 rounded-lg border border-outline-variant px-2 py-1.5 text-xs font-mono"
                  />
                </div>
                <Input
                  placeholder="Nom (FR)"
                  dir="ltr"
                  value={v.nameFr ?? ""}
                  onChange={(e) => updateVariant(idx, { nameFr: e.target.value })}
                />
                <Input
                  placeholder="الاسم (عربي)"
                  value={v.nameAr ?? ""}
                  onChange={(e) => updateVariant(idx, { nameAr: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  {v.image ? (
                    <img src={v.image} alt="" className="w-12 h-12 object-contain rounded-lg bg-white ring-1 ring-outline-variant/40" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white ring-1 ring-outline-variant/40 flex items-center justify-center text-xs text-on-surface-variant">
                      —
                    </div>
                  )}
                  <label className="px-3 py-2 rounded-lg bg-white ring-1 ring-outline-variant/40 text-xs font-bold cursor-pointer hover:ring-primary/40">
                    {variantUploadingIdx === idx ? "..." : v.image ? "استبدال" : "رفع صورة"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadVariantImage(idx, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  className="w-9 h-9 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100"
                  aria-label="حذف"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Specs */}
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />
        <div>
          <Label>{ar.productForm.specs}</Label>
          <Textarea
            rows={8}
            className="font-mono"
            value={specsText}
            onChange={(e) => setSpecsText(e.target.value)}
            dir="ltr"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? ar.productForm.saving : ar.productForm.save}
        </Button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="text-on-surface-variant text-xs font-bold"
        >
          {ar.productForm.cancel}
        </button>
      </div>
    </form>
  );
}
