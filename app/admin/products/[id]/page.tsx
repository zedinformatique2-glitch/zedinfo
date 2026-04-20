"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductForm } from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const products = useQuery(api.products.list, {});
  const product = products?.find((p: any) => p._id === id);

  if (!products) return <div className="p-8">جاري التحميل...</div>;
  if (!product) return <div className="p-8">غير موجود</div>;

  return (
    <ProductForm
      initial={{
        _id: product._id,
        slug: product.slug,
        categoryId: product.categoryId,
        brand: product.brand,
        nameFr: product.nameFr,
        nameAr: product.nameAr,
        descFr: product.descFr,
        descAr: product.descAr,
        priceDzd: product.priceDzd,
        stock: product.stock,
        images: product.images,
        featured: product.featured,
        specs: product.specs || {},
        colorVariants: product.colorVariants,
      }}
    />
  );
}
