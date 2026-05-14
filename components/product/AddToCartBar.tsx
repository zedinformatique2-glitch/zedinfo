"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { useProductVariant } from "@/lib/product-variant-store";
import { Icon } from "@/components/ui/Icon";

type Props = {
  product: {
    _id: string;
    slug: string;
    nameFr: string;
    nameAr: string;
    priceDzd: number;
    images: string[];
    stock: number;
  };
  addLabel: string;
  qtyLabel: string;
};

export function AddToCartBar({ product, addLabel, qtyLabel }: Props) {
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const selectedColor = useProductVariant((s) => s.selected[product.slug]);
  const disabled = product.stock <= 0;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center rounded-xl ring-1 ring-outline-variant/60 bg-white overflow-hidden">
        <button
          className="w-12 h-14 flex items-center justify-center hover:bg-primary/5 hover:text-primary transition-colors"
          onClick={() => setQty(Math.max(1, qty - 1))}
          aria-label="-"
        >
          <Icon name="remove" />
        </button>
        <span className="w-12 text-center font-bold">{qty}</span>
        <button
          className="w-12 h-14 flex items-center justify-center hover:bg-primary/5 hover:text-primary transition-colors"
          onClick={() => setQty(qty + 1)}
          aria-label="+"
        >
          <Icon name="add" />
        </button>
      </div>
      <button
        disabled={disabled}
        onClick={() =>
          add(
            {
              productId: product._id,
              slug: product.slug,
              nameFr: product.nameFr,
              nameAr: product.nameAr,
              priceDzd: product.priceDzd,
              image: selectedColor?.image || product.images[0] || "",
              selectedColor,
            },
            qty
          )
        }
        className="flex-1 h-14 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-xs shadow-[0_8px_20px_-8px_rgba(0,53,208,0.5)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {addLabel}
      </button>
    </div>
  );
}
