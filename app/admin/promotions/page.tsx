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

const PROMO_TYPES = [
  { value: "promotion", label: "Promotion" },
  { value: "special_offer", label: "Offre Spéciale" },
  { value: "flash_sale", label: "Vente Flash" },
  { value: "new_arrival", label: "Nouveau Produit" },
  { value: "best_seller", label: "Best Seller" },
  { value: "limited_stock", label: "Stock Limité" },
  { value: "bundle", label: "Pack / Bundle" },
  { value: "custom", label: "Personnalisé" },
];

const IMAGE_STYLES = [
  { value: "dark_neon", label: "Dark Neon Gaming", desc: "Fond sombre, néon violet/bleu, style gaming pro" },
  { value: "dark_blue", label: "Dark Blue Tech", desc: "Fond bleu foncé, accents cyan, style tech" },
  { value: "clean_white", label: "Clean White", desc: "Fond blanc, grille bleue, style e-commerce" },
  { value: "gradient_dark", label: "Gradient Sombre", desc: "Dégradé noir-violet, éclairage dramatique" },
];

const PRICE_STYLES = [
  { value: "normal", label: "Prix normal" },
  { value: "discount_percent", label: "Réduction %" },
  { value: "old_new", label: "Ancien prix → Nouveau prix" },
  { value: "starting_from", label: "À partir de..." },
  { value: "custom", label: "Texte personnalisé" },
];

function buildPrompt({
  product,
  promoType,
  priceStyle,
  discountPercent,
  oldPrice,
  customPriceText,
  customText,
  imageStyle,
}: {
  product: any;
  promoType: string;
  priceStyle: string;
  discountPercent: string;
  oldPrice: string;
  customPriceText: string;
  customText: string;
  imageStyle: string;
}) {
  if (!product) return "";

  const promoLabel: Record<string, string> = {
    promotion: "PROMOTION",
    special_offer: "OFFRE SPÉCIALE",
    flash_sale: "VENTE FLASH",
    new_arrival: "NOUVEAU",
    best_seller: "BEST SELLER",
    limited_stock: "STOCK LIMITÉ",
    bundle: "PACK SPÉCIAL",
    custom: customText || "PROMOTION",
  };

  let priceSection = "";
  switch (priceStyle) {
    case "normal":
      priceSection = `Display the price as huge bold white text: "${product.priceDzd}" with "DA" in smaller superscript text next to it. The price should be one of the most prominent elements. Place it in a glowing neon-bordered box or badge at the bottom-right area.`;
      break;
    case "discount_percent":
      priceSection = `Show a big "-${discountPercent || "20"}%" badge in a glowing red/yellow neon circle or starburst. Display the new price "${product.priceDzd}" with "DA" as huge bold white text in a neon-bordered price box.`;
      break;
    case "old_new":
      priceSection = `Show the old price "${oldPrice || product.priceDzd} DA" crossed out with a red strikethrough line in smaller text, and the new price "${product.priceDzd}" with "DA" as huge bold white glowing text below it. Use a neon-bordered box for the price area.`;
      break;
    case "starting_from":
      priceSection = `Display "PRICE" label above, then "${product.priceDzd}" with "DA" in huge bold white glowing text in a neon-bordered price box.`;
      break;
    case "custom":
      priceSection = `Display this price text: "${customPriceText || product.priceDzd + " DA"}" as huge bold white glowing text in a neon-bordered price box.`;
      break;
  }

  // Extract key specs from product for feature badges
  const specs = product.specs;
  let specBadges = "";
  if (specs) {
    const specItems: string[] = [];
    if (specs.type === "cpu") {
      if (specs.cores) specItems.push(`${specs.cores} Cores / ${specs.threads || specs.cores * 2} Threads`);
      if (specs.baseClock) specItems.push(`${specs.baseClock} GHz Base Clock`);
      if (specs.boostClock) specItems.push(`${specs.boostClock} GHz Boost`);
      if (specs.socket) specItems.push(`Socket ${specs.socket}`);
      if (specs.tdp) specItems.push(`${specs.tdp}W TDP`);
    } else if (specs.type === "gpu") {
      if (specs.vram) specItems.push(`${specs.vram}GB VRAM`);
      if (specs.boostClock) specItems.push(`${specs.boostClock} MHz Boost`);
    } else if (specs.type === "motherboard") {
      if (specs.socket) specItems.push(`Socket ${specs.socket}`);
      if (specs.chipset) specItems.push(`${specs.chipset} Chipset`);
      if (specs.ramType) specItems.push(`${specs.ramType} Support`);
      if (specs.formFactor) specItems.push(`${specs.formFactor}`);
    } else if (specs.type === "ram") {
      if (specs.capacity) specItems.push(`${specs.capacity}GB`);
      if (specs.speed) specItems.push(`${specs.speed} MHz`);
      if (specs.ramType) specItems.push(`${specs.ramType}`);
    } else if (specs.type === "storage") {
      if (specs.capacity) specItems.push(`${specs.capacity}`);
      if (specs.interface) specItems.push(`${specs.interface}`);
      if (specs.readSpeed) specItems.push(`${specs.readSpeed} MB/s Read`);
    } else if (specs.type === "psu") {
      if (specs.wattage) specItems.push(`${specs.wattage}W`);
      if (specs.efficiency) specItems.push(`${specs.efficiency}`);
      if (specs.modular) specItems.push(`Modular`);
    } else if (specs.type === "case") {
      if (specs.formFactor) specItems.push(`${specs.formFactor}`);
      if (specs.maxGpuLength) specItems.push(`GPU up to ${specs.maxGpuLength}mm`);
    } else if (specs.type === "cooler") {
      if (specs.type) specItems.push(specs.coolerType || "");
      if (specs.tdp) specItems.push(`${specs.tdp}W TDP`);
    }
    if (specItems.length > 0) {
      specBadges = `\n\nFEATURE SPEC BADGES (right side, stacked vertically):
Each spec gets its own rounded rectangle badge with a dark semi-transparent background, a subtle neon purple/blue border glow, and a small icon on the left. Use bold white text for the spec title and lighter gray subtext:
${specItems.map((s, i) => `${i + 1}. "${s}"`).join("\n")}`;
    }
  }

  const extraText = customText && promoType !== "custom" ? `\nADDITIONAL TEXT: Include "${customText}" as a highlighted callout.` : "";

  const styleGuides: Record<string, string> = {
    dark_neon: `BACKGROUND & ATMOSPHERE:
- Deep BLACK/very dark background (#0a0a0f)
- Large circular NEON GLOW RING behind the product — purple (#8b5cf6) and blue (#3b82f6) gradient, creating a dramatic halo/portal effect
- Subtle purple and blue light particles/bokeh floating in the scene
- A glossy, reflective dark surface beneath the product (like a dark glass table)
- Faint purple/blue ambient lighting illuminating the edges of the product

LAYOUT (structured like a professional product spec sheet):
- LEFT SIDE (40-50%): Product hero shot — the product shown at a slight angle with its retail box behind/beside it, dramatically lit by the neon glow
- TOP RIGHT: Brand logo, then product model name in HUGE bold white text with subtle glow
- RIGHT SIDE: Feature spec badges stacked vertically
- BOTTOM RIGHT: Price in a glowing neon-bordered box
- BOTTOM STRIP: Row of small circular icons with key specs underneath (like compatibility icons)

COLOR PALETTE: Black, deep purple (#8b5cf6), electric blue (#3b82f6), white text, subtle cyan accents`,

    dark_blue: `BACKGROUND & ATMOSPHERE:
- Deep dark navy/blue-black gradient background (#0a1628 to #1a2744)
- Geometric tech patterns and circuit-board style lines in very subtle cyan (#06b6d4) at low opacity
- Clean, modern tech feel with subtle blue light rays from behind the product
- Reflective dark surface beneath the product

LAYOUT:
- LEFT SIDE: Product hero shot at slight angle with retail packaging
- TOP RIGHT: Brand + model name in large bold white text
- RIGHT SIDE: Feature badges with dark backgrounds and cyan neon borders
- BOTTOM: Price area and spec icon strip

COLOR PALETTE: Dark navy, cyan (#06b6d4), white text, electric blue accents`,

    clean_white: `BACKGROUND & ATMOSPHERE:
- Clean WHITE background with a subtle blue grid/line pattern overlay at LOW OPACITY
- Modern tech blueprint feel, professional and minimal
- Soft shadows under the product

LAYOUT:
- CENTER: Product hero shot
- TOP LEFT: Zed Informatique logo and branding in navy blue (#0035d0)
- RIGHT SIDE: Feature badges with white backgrounds, blue borders
- BOTTOM: Price in large bold navy text

COLOR PALETTE: White, navy blue (#0035d0), gray accents, clean and corporate`,

    gradient_dark: `BACKGROUND & ATMOSPHERE:
- Rich gradient from black (#000) through deep purple (#2d1b69) to dark blue (#1e3a5f)
- Dramatic volumetric lighting from behind the product
- Subtle smoke/mist effects at the base
- Glossy reflective surface

LAYOUT:
- LEFT SIDE: Product hero shot with dramatic lighting, showing the product and box
- TOP RIGHT: Brand + large product name in white with subtle purple glow
- RIGHT SIDE: Feature badges with frosted glass effect backgrounds
- BOTTOM RIGHT: Price in glowing box

COLOR PALETTE: Black, purple, blue, white text, gold accents for price`,
  };

  return `Generate a PROFESSIONAL PRODUCT PROMOTIONAL IMAGE. This must look like a high-end social media product advertisement for a tech/PC components store.

STORE BRANDING:
- Store name: "ZED INFORMATIQUE" — place it subtly in the top area
- The brand of the product "${product.brand}" should be shown with its logo style in the top-left or top-right

PRODUCT:
- Product: "${product.nameFr}"
- Brand: "${product.brand}"
- The product name "${product.nameFr}" must be displayed in VERY LARGE, BOLD, modern sans-serif white text (like Impact, Montserrat Black, or similar heavy font)
- Show the product at a dramatic 3/4 angle view, hero shot style, with its retail box visible beside/behind it

${styleGuides[imageStyle] || styleGuides.dark_neon}

PROMO TYPE:
- Display "${promoLabel[promoType]}" as a small badge/tag near the product name — subtle but visible, in a contrasting color (gold, red, or cyan depending on type)

PRICE:
- ${priceSection}
- The price numbers must be MASSIVE and BOLD — this is a key selling point${specBadges}

BOTTOM STRIP:
- Include a horizontal row of 4-5 small circular icons at the very bottom with key product highlights underneath each (like "Compatible Windows/Mac", brand features, etc.)

TYPOGRAPHY RULES:
- ALL text must be perfectly sharp, readable, and properly spelled
- Use modern, clean sans-serif fonts (Montserrat, Inter, or similar)
- Strong visual hierarchy: Product name (largest) > Price (second largest) > Specs > Brand
- White and light gray text on dark backgrounds
- Bold headlines, regular weight for descriptions${extraText}

CRITICAL QUALITY REQUIREMENTS:
- This must look like it was designed by a professional graphic designer in Photoshop
- Photorealistic product rendering — not cartoon or illustration
- Clean, sharp edges on all text and badges
- Professional lighting and shadows
- Social media ready — high impact, eye-catching, premium feel
- NO watermarks, NO placeholder text, NO lorem ipsum`;
}

export default function PromotionsPage() {
  const products = useQuery(api.products.list, {});
  const promotions = useQuery(api.promotions.list, {});
  const generateImage = useAction(api.promotionActions.generateImage);
  const postToMeta = useAction(api.promotionActions.postToMeta);
  const removePromotion = useMutation(api.promotions.remove);

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [promoType, setPromoType] = useState("promotion");
  const [priceStyle, setPriceStyle] = useState("normal");
  const [discountPercent, setDiscountPercent] = useState("20");
  const [oldPrice, setOldPrice] = useState("");
  const [customPriceText, setCustomPriceText] = useState("");
  const [customText, setCustomText] = useState("");
  const [imageStyle, setImageStyle] = useState("dark_neon");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [prompt, setPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPromoId, setGeneratedPromoId] = useState<string | null>(null);
  const [lastCost, setLastCost] = useState<number | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCost = promotions?.reduce((sum, p) => sum + (p.costUsd || 0), 0) ?? 0;

  const selectedProduct = products?.find((p) => p._id === selectedProductId);

  const refreshPrompt = (overrides?: Partial<{
    product: any; promoType: string; priceStyle: string;
    discountPercent: string; oldPrice: string; customPriceText: string; customText: string; imageStyle: string;
  }>) => {
    const p = overrides?.product ?? selectedProduct;
    if (!p) return;
    setPrompt(buildPrompt({
      product: p,
      promoType: overrides?.promoType ?? promoType,
      priceStyle: overrides?.priceStyle ?? priceStyle,
      discountPercent: overrides?.discountPercent ?? discountPercent,
      oldPrice: overrides?.oldPrice ?? oldPrice,
      customPriceText: overrides?.customPriceText ?? customPriceText,
      customText: overrides?.customText ?? customText,
      imageStyle: overrides?.imageStyle ?? imageStyle,
    }));
  };

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const product = products?.find((p) => p._id === id);
    if (product) {
      setOldPrice(String(product.priceDzd));
      refreshPrompt({ product });
    }
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
      setLastCost(result.costUsd ?? null);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface">{ar.promotions.title}</h1>
          <p className="text-sm text-on-surface-variant mt-1">{ar.promotions.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 px-4 py-3 text-center">
            <p className="text-xs text-on-surface-variant font-bold">Images générées</p>
            <p className="text-lg font-black text-on-surface">{promotions?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 px-4 py-3 text-center">
            <p className="text-xs text-on-surface-variant font-bold">Coût total</p>
            <p className="text-lg font-black text-primary">${totalCost.toFixed(4)}</p>
          </div>
        </div>
      </div>

      {/* Generator Card */}
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 space-y-5">
        {/* Row 1: Product + Promo Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              Type de promotion
            </label>
            <select
              value={promoType}
              onChange={(e) => { setPromoType(e.target.value); refreshPrompt({ promoType: e.target.value }); }}
              className="w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {PROMO_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Image Style */}
        <div>
          <label className="block text-sm font-bold text-on-surface mb-2">
            Style d&apos;image
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {IMAGE_STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => { setImageStyle(s.value); refreshPrompt({ imageStyle: s.value }); }}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                  imageStyle === s.value
                    ? "bg-primary text-white shadow-md ring-2 ring-primary"
                    : "bg-surface-variant text-on-surface-variant hover:bg-primary/10 ring-1 ring-outline-variant/40"
                }`}
              >
                {s.label}
                <span className="block text-xs font-normal opacity-70 mt-0.5">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Price Style + related inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              Affichage du prix
            </label>
            <select
              value={priceStyle}
              onChange={(e) => { setPriceStyle(e.target.value); refreshPrompt({ priceStyle: e.target.value }); }}
              className="w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {PRICE_STYLES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {priceStyle === "discount_percent" && (
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">
                Pourcentage de réduction
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => { setDiscountPercent(e.target.value); refreshPrompt({ discountPercent: e.target.value }); }}
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="20"
                  min="1"
                  max="99"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">%</span>
              </div>
            </div>
          )}

          {priceStyle === "old_new" && (
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">
                Ancien prix (DZD)
              </label>
              <input
                type="number"
                value={oldPrice}
                onChange={(e) => { setOldPrice(e.target.value); refreshPrompt({ oldPrice: e.target.value }); }}
                className="w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: 85000"
              />
            </div>
          )}

          {priceStyle === "custom" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-on-surface mb-2">
                Texte du prix personnalisé
              </label>
              <input
                type="text"
                value={customPriceText}
                onChange={(e) => { setCustomPriceText(e.target.value); refreshPrompt({ customPriceText: e.target.value }); }}
                className="w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: 2 pour 15000 DZD, Gratuit avec achat, etc."
              />
            </div>
          )}
        </div>

        {/* Row 3: Custom text */}
        <div>
          <label className="block text-sm font-bold text-on-surface mb-2">
            Texte supplémentaire (optionnel)
          </label>
          <input
            type="text"
            value={customText}
            onChange={(e) => { setCustomText(e.target.value); refreshPrompt({ customText: e.target.value }); }}
            className="w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ex: Livraison gratuite, Garantie 2 ans, Offre limitée..."
          />
        </div>

        {/* Aspect Ratio Picker */}
        <div>
          <label className="block text-sm font-bold text-on-surface mb-2">
            {ar.promotions.aspectRatio}
          </label>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.value}
                onClick={() => setAspectRatio(r.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  aspectRatio === r.value
                    ? "bg-primary text-white shadow-md"
                    : "bg-surface-variant text-on-surface-variant hover:bg-primary/10"
                }`}
              >
                {r.label}
                <span className="block text-xs font-normal opacity-70">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt (collapsible) */}
        <div>
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-base">
              {showPrompt ? "expand_less" : "expand_more"}
            </span>
            {showPrompt ? "Masquer" : "Voir / modifier"} le prompt IA
          </button>
          {showPrompt && (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={10}
              className="mt-2 w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-xs font-mono resize-y focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          )}
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
          <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm break-all">
            {error}
          </div>
        )}

        {/* Preview */}
        {generatedImage && (
          <div className="space-y-4">
            {lastCost !== null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 ring-1 ring-amber-200 text-sm">
                <span className="material-symbols-outlined text-amber-600 text-base">paid</span>
                <span className="text-amber-800">
                  Coût de cette image : <strong>${lastCost.toFixed(4)}</strong> USD
                </span>
              </div>
            )}
            <div className="rounded-2xl overflow-hidden ring-1 ring-outline-variant/40 bg-gray-100 flex items-center justify-center">
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
                className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 overflow-hidden"
              >
                <div className="aspect-square bg-gray-50 flex items-center justify-center">
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
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-on-surface-variant">
                    <span>{promo.aspectRatio}</span>
                    <span>·</span>
                    <span>{new Date(promo.createdAt).toLocaleDateString("fr-DZ")}</span>
                    {promo.costUsd != null && promo.costUsd > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-amber-600 font-bold">${promo.costUsd.toFixed(4)}</span>
                      </>
                    )}
                    {promo.postedAt && (
                      <>
                        <span>·</span>
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
