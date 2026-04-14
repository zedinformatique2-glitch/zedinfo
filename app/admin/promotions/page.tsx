"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ar } from "@/lib/admin-i18n";

const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1", desc: "Instagram Post" },
  { label: "4:5", value: "4:5", desc: "Instagram Feed" },
  { label: "16:9", value: "16:9", desc: "Facebook" },
  { label: "9:16", value: "9:16", desc: "Stories" },
];

function buildDefaultPrompt(product: any) {
  if (!product) return "";
  return `Create a promotional banner for "${product.nameFr}" by ${product.brand}, priced at ${product.priceDzd} DZD. Include the product image prominently, brand name, and price tag. Modern tech aesthetic, dark background with navy (#0035d0) accents, clean typography, eye-catching design for social media.`;
}

export default function PromotionsPage() {
  const products = useQuery(api.products.list, {});
  const promotions = useQuery(api.promotions.list, {});
  const generateImage = useAction(api.promotionActions.generateImage);
  const postToMeta = useAction(api.promotionActions.postToMeta);
  const removePromotion = useMutation(api.promotions.remove);

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPromoId, setGeneratedPromoId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products?.find((p) => p._id === selectedProductId);

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const product = products?.find((p) => p._id === id);
    setPrompt(buildDefaultPrompt(product));
    setGeneratedImage(null);
    setGeneratedPromoId(null);
  };

  const handleGenerate = async () => {
    if (!selectedProductId || !prompt) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await generateImage({
        productId: selectedProductId as Id<"products">,
        prompt,
        aspectRatio,
      });
      setGeneratedImage(result.imageUrl);
      setGeneratedPromoId(result.promoId as string);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handlePost = async (platform: "facebook" | "instagram" | "both") => {
    if (!generatedPromoId || !selectedProduct) return;
    setPosting(true);
    setError(null);
    try {
      const caption = `${selectedProduct.nameFr} - ${selectedProduct.priceDzd} DZD\n${selectedProduct.brand}\n\n🛒 Disponible chez Zed Informatique`;
      await postToMeta({
        promoId: generatedPromoId as Id<"promotions">,
        platform,
        caption,
      });
    } catch (e: any) {
      setError(e.message || "Posting failed");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(ar.promotions.deleteConfirm)) return;
    await removePromotion({ id: id as Id<"promotions"> });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-on-surface">{ar.promotions.title}</h1>
        <p className="text-sm text-on-surface-variant mt-1">{ar.promotions.subtitle}</p>
      </div>

      {/* Generator Card */}
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 space-y-5">
        {/* Product Selector */}
        <div>
          <label className="block text-sm font-bold text-on-surface mb-2">
            {ar.promotions.selectProduct}
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductSelect(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">— {ar.promotions.selectProduct} —</option>
            {products?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.nameFr} — {p.brand} — {p.priceDzd} DZD
              </option>
            ))}
          </select>
        </div>

        {/* Aspect Ratio Picker */}
        <div>
          <label className="block text-sm font-bold text-on-surface mb-2">
            {ar.promotions.aspectRatio}
          </label>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.value}
                onClick={() => setAspectRatio(ar.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  aspectRatio === ar.value
                    ? "bg-primary text-white shadow-md"
                    : "bg-surface-variant text-on-surface-variant hover:bg-primary/10"
                }`}
              >
                {ar.label}
                <span className="block text-xs font-normal opacity-70">{ar.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-sm font-bold text-on-surface mb-2">
            {ar.promotions.prompt}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm resize-y focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Describe the promotional image you want to generate..."
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!selectedProductId || !prompt || generating}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          <span className="material-symbols-outlined text-lg">auto_awesome</span>
          {generating ? ar.promotions.generating : ar.promotions.generate}
        </button>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Preview */}
        {generatedImage && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden ring-1 ring-outline-variant/40 bg-black flex items-center justify-center">
              <img
                src={generatedImage}
                alt="Generated promo"
                className="max-w-full max-h-[500px] object-contain"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={generatedImage}
                download={`promo-${selectedProduct?.slug || "image"}.png`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-variant text-on-surface font-bold text-sm hover:bg-primary/10 transition-all"
              >
                <span className="material-symbols-outlined text-base">download</span>
                {ar.promotions.download}
              </a>
              <button
                onClick={() => handlePost("facebook")}
                disabled={posting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">share</span>
                {posting ? ar.promotions.posting : ar.promotions.postFacebook}
              </button>
              <button
                onClick={() => handlePost("instagram")}
                disabled={posting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">photo_camera</span>
                {posting ? ar.promotions.posting : ar.promotions.postInstagram}
              </button>
              <button
                onClick={() => handlePost("both")}
                disabled={posting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-900 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">public</span>
                {posting ? ar.promotions.posting : ar.promotions.postBoth}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-black text-on-surface mb-4">{ar.promotions.history}</h2>
        {!promotions || promotions.length === 0 ? (
          <p className="text-sm text-on-surface-variant">{ar.promotions.noPromotions}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map((promo) => (
              <div
                key={promo._id}
                className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 overflow-hidden group"
              >
                <div className="aspect-square bg-black flex items-center justify-center">
                  <img
                    src={promo.imageUrl}
                    alt="Promo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-sm font-bold text-on-surface truncate">
                    {promo.product?.nameFr || "—"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span>{promo.aspectRatio}</span>
                    <span>•</span>
                    <span>{new Date(promo.createdAt).toLocaleDateString("fr-DZ")}</span>
                    {promo.postedAt && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 font-bold">{ar.promotions.posted}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={promo.imageUrl}
                      download
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-variant text-on-surface-variant text-xs font-bold hover:bg-primary/10 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      {ar.promotions.download}
                    </a>
                    <button
                      onClick={() => handleDelete(promo._id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      {ar.promotions.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
