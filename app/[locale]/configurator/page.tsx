"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart-store";
import { formatDzd, localizedName } from "@/lib/format";
import {
  CONFIG_SLOTS,
  checkCompatibility,
  filterCompatibleProducts,
  type ConfigSelection,
  type ConfigComponent,
  type SlotKey,
} from "@/lib/configurator-engine";
import { AiChat } from "@/components/configurator/AiChat";
import { FpsEstimator } from "@/components/configurator/FpsEstimator";
import type { Locale } from "@/lib/i18n/config";


const SLOT_ICONS: Record<string, string> = {
  cpu: "developer_board",
  motherboard: "dashboard",
  ram: "memory",
  gpu: "memory_alt",
  storage: "storage",
  psu: "bolt",
  case: "settings",
  cooler: "desktop_windows",
};

export default function ConfiguratorPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations("configurator");
  const tc = useTranslations("common");

  const [selection, setSelection] = useState<ConfigSelection>({});
  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const allProducts = useQuery(api.products.list, {});
  const saveBuild = useMutation(api.configurator.saveBuild);
  const addToCart = useCart((s) => s.add);

  const openSlotMeta = openSlot
    ? CONFIG_SLOTS.find((s) => s.key === openSlot)
    : null;

  const slotProducts = useQuery(
    api.products.list,
    openSlotMeta ? { categorySlug: openSlotMeta.categorySlug } : "skip"
  );

  const result = useMemo(() => checkCompatibility(selection), [selection]);

  const filteredSlotProducts = useMemo(() => {
    if (!slotProducts || !openSlot) return [];
    const filtered = filterCompatibleProducts(slotProducts as any[], selection, openSlot).map((f) => {
      // Availability is separate from compatibility: an out-of-stock part can't be
      // picked even if it's technically compatible. Mirrors the rest of the site
      // (ProductCard / AddToCartBar / shop filter / AI chat all gate on stock > 0).
      const inStock = ((f.product as any).stock ?? 0) > 0;
      return { ...f, inStock, selectable: f.compatible && inStock };
    });
    return filtered.sort((a, b) => {
      if (a.selectable === b.selectable) return 0;
      return a.selectable ? -1 : 1;
    });
  }, [slotProducts, openSlot, selection]);

  function setSingle(key: SlotKey, comp: ConfigComponent) {
    setSelection((s) => ({ ...s, [key]: comp }));
    setOpenSlot(null);
  }

  function clearSlot(key: SlotKey) {
    setSelection((s) => {
      const next = { ...s };
      delete (next as any)[key];
      return next;
    });
  }

  // ── Multi-quantity slots (RAM, Storage, Cooling) ─────────────────────────
  // Quantity is modelled as repeated entries in the array, so the engine,
  // cart, and save logic keep working unchanged. The UI groups by itemKey.
  type MultiKey = "ram" | "storage" | "cooler";
  const itemKey = (c: ConfigComponent): string => c._id ?? c.slug;

  function addMultiItem(key: MultiKey, comp: ConfigComponent) {
    setSelection((s) => ({ ...s, [key]: [...(s[key] ?? []), comp] }));
    setOpenSlot(null);
  }

  function incMultiItem(key: MultiKey, k: string) {
    setSelection((s) => {
      const arr = s[key] ?? [];
      const found = arr.find((c) => itemKey(c) === k);
      if (!found) return s;
      return { ...s, [key]: [...arr, found] };
    });
  }

  function decMultiItem(key: MultiKey, k: string) {
    setSelection((s) => {
      const arr = s[key] ?? [];
      const idx = arr.findIndex((c) => itemKey(c) === k);
      if (idx === -1) return s;
      const arrNext = [...arr.slice(0, idx), ...arr.slice(idx + 1)];
      const next = { ...s };
      if (arrNext.length) (next as any)[key] = arrNext;
      else delete (next as any)[key];
      return next;
    });
  }

  function removeMultiGroup(key: MultiKey, k: string) {
    setSelection((s) => {
      const arrNext = (s[key] ?? []).filter((c) => itemKey(c) !== k);
      const next = { ...s };
      if (arrNext.length) (next as any)[key] = arrNext;
      else delete (next as any)[key];
      return next;
    });
  }

  /** Group repeated entries into { comp, qty }, preserving insertion order. */
  function groupItems(items: ConfigComponent[] = []): { comp: ConfigComponent; qty: number }[] {
    const map = new Map<string, { comp: ConfigComponent; qty: number }>();
    for (const it of items) {
      const k = itemKey(it);
      const ex = map.get(k);
      if (ex) ex.qty += 1;
      else map.set(k, { comp: it, qty: 1 });
    }
    return [...map.values()];
  }

  const slotTotal = (key: SlotKey): number => {
    if (key === "ram" || key === "storage" || key === "cooler")
      return (selection[key] ?? []).reduce((sum, c) => sum + c.priceDzd, 0);
    const c = (selection as any)[key] as ConfigComponent | undefined;
    return c ? c.priceDzd : 0;
  };

  const slotFilled = (key: SlotKey): boolean => {
    if (key === "ram" || key === "storage" || key === "cooler")
      return (selection[key]?.length ?? 0) > 0;
    return !!(selection as any)[key];
  };

  const isMultiSlot = (key: SlotKey): key is MultiKey =>
    key === "ram" || key === "storage" || key === "cooler";

  async function onSave() {
    const ids: string[] = [];
    if (selection.cpu?._id) ids.push(selection.cpu._id);
    if (selection.motherboard?._id) ids.push(selection.motherboard._id);
    selection.ram?.forEach((r) => r._id && ids.push(r._id));
    if (selection.gpu?._id) ids.push(selection.gpu._id);
    selection.storage?.forEach((s) => s._id && ids.push(s._id));
    if (selection.psu?._id) ids.push(selection.psu._id);
    if (selection.case?._id) ids.push(selection.case._id);
    selection.cooler?.forEach((c) => c._id && ids.push(c._id));
    if (ids.length === 0) return;
    const res = await saveBuild({
      componentIds: ids as any,
      totalDzd: result.totalPrice,
    });
    setShareCode(res.shareCode);
  }

  function addAllToCart() {
    const comps = [
      selection.cpu,
      selection.motherboard,
      ...(selection.ram ?? []),
      selection.gpu,
      ...(selection.storage ?? []),
      selection.psu,
      selection.case,
      ...(selection.cooler ?? []),
    ].filter((c): c is ConfigComponent => !!c);
    comps.forEach((c) => {
      addToCart({
        productId: c._id,
        slug: c.slug,
        nameFr: c.nameFr,
        nameAr: c.nameAr,
        priceDzd: c.priceDzd,
        image: "",
        fromBuild: true,
      });
    });
  }

  const slotComponent = (key: SlotKey): ConfigComponent | undefined => {
    if (key === "ram") return selection.ram?.[0];
    if (key === "storage") return selection.storage?.[0];
    if (key === "cooler") return selection.cooler?.[0];
    return (selection as any)[key];
  };

  const selectedCount = CONFIG_SLOTS.filter((s) => slotFilled(s.key)).length;

  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container-zed py-10 lg:py-14">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl lg:text-5xl font-black tracking-tight">
            <span className="text-primary">{t("title").split(" ")[0]}</span>{" "}
            {t("title").split(" ").slice(1).join(" ")}
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left sidebar — Build Summary */}
          <div className="lg:w-72 shrink-0 order-2 lg:order-1">
            <div className="lg:sticky lg:top-20 bg-slate-50 rounded-2xl p-6">
              <h2 className="font-bold text-lg mb-5">{t("buildSummary")}</h2>

              <div className="space-y-3">
                {CONFIG_SLOTS.map((slot) => {
                  const filled = slotFilled(slot.key);
                  return (
                    <div key={slot.key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{t(`steps.${slot.key}` as any)}</span>
                      <span className={filled ? "font-semibold text-slate-900" : "text-slate-300"}>
                        {filled ? formatDzd(slotTotal(slot.key), locale) : "---"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-200 mt-5 pt-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{t("totalPrice")}</span>
                  <span className="font-black text-xl text-primary">
                    {formatDzd(result.totalPrice, locale)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {selectedCount} / {CONFIG_SLOTS.length} {t("selected")}
                </p>
              </div>

              {/* Errors / warnings */}
              {result.errors.length > 0 && (
                <div className="mt-4 space-y-2">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-xs text-red-600 flex gap-1.5 items-start">
                      <Icon name="error" className="text-red-500 text-[16px] shrink-0 mt-px" />
                      {e}
                    </div>
                  ))}
                </div>
              )}
              {result.warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="text-xs text-amber-700 flex gap-1.5 items-start">
                      <Icon name="warning" className="text-amber-500 text-[16px] shrink-0 mt-px" />
                      {w}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 space-y-2">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={addAllToCart}
                  disabled={selectedCount === 0}
                >
                  {tc("addToCart")}
                </Button>
                <Button
                  className="w-full"
                  size="sm"
                  variant="outline"
                  onClick={onSave}
                  disabled={selectedCount === 0}
                >
                  {t("saveBuild")}
                </Button>
                <button
                  onClick={() => setAiChatOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <Icon name="smart_toy" className="text-[18px]" />
                  {t("aiAssistant")}
                </button>
              </div>

              {shareCode && (
                <div className="mt-4 bg-primary/5 rounded-xl p-3 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Share code</div>
                  <div className="font-mono font-black text-primary text-lg">{shareCode}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Slot cards + FPS estimator */}
          <div className="flex-1 order-1 lg:order-2 space-y-4">
            {CONFIG_SLOTS.map((slot) => {
              const multi = isMultiSlot(slot.key);
              const current = multi ? undefined : slotComponent(slot.key);
              const groups = multi ? groupItems((selection as any)[slot.key]) : [];
              const filled = slotFilled(slot.key);
              const isOpen = openSlot === slot.key;
              return (
                <div key={slot.key} className="rounded-2xl ring-1 ring-slate-200 overflow-hidden">
                  {/* Slot header row */}
                  <div className="flex items-center gap-4 bg-white p-4 sm:p-5">
                    {/* Select button */}
                    <button
                      onClick={() => setOpenSlot(isOpen ? null : slot.key)}
                      className="shrink-0 bg-primary text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      {multi
                        ? filled ? t("addAnother") : t("select")
                        : current ? t("change") : t("select")}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm sm:text-base">
                        {t(`steps.${slot.key}` as any)}
                      </div>
                      {!multi && current ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm text-slate-600 truncate">
                            {localizedName(current, locale)}
                          </span>
                          <span className="text-primary font-bold text-sm whitespace-nowrap">
                            {formatDzd(current.priceDzd, locale)}
                          </span>
                          <button
                            onClick={() => clearSlot(slot.key)}
                            className="text-slate-400 hover:text-red-500 transition-colors ms-1"
                            aria-label={tc("delete")}
                          >
                            <Icon name="close" className="text-[16px]" />
                          </button>
                        </div>
                      ) : !filled ? (
                        <p className="text-xs text-slate-400 mt-0.5">{t("notSelected")}</p>
                      ) : null}
                    </div>

                    {/* Icon */}
                    <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Icon name={SLOT_ICONS[slot.key]} className="text-[22px]" />
                    </div>
                  </div>

                  {/* Selected items list with quantity steppers (multi slots) */}
                  {multi && groups.length > 0 && (
                    <div className="border-t border-slate-200 bg-white p-3 sm:p-4 space-y-2">
                      {groups.map(({ comp, qty }) => {
                        const k = itemKey(comp);
                        return (
                          <div key={k} className="flex items-center gap-2 sm:gap-3 rounded-xl ring-1 ring-slate-200 p-2.5 sm:p-3">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                              <Icon name={SLOT_ICONS[slot.key]} className="text-[20px]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-slate-900 truncate">
                                {localizedName(comp, locale)}
                              </div>
                              <div className="text-xs text-slate-400">
                                {formatDzd(comp.priceDzd, locale)}
                              </div>
                            </div>
                            {/* Quantity stepper */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => decMultiItem(slot.key as MultiKey, k)}
                                className="h-7 w-7 rounded-lg ring-1 ring-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                                aria-label="-"
                              >
                                <Icon name="remove" className="text-[16px]" />
                              </button>
                              <span className="w-6 text-center text-sm font-bold tabular-nums">{qty}</span>
                              <button
                                onClick={() => incMultiItem(slot.key as MultiKey, k)}
                                className="h-7 w-7 rounded-lg ring-1 ring-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                                aria-label="+"
                              >
                                <Icon name="add" className="text-[16px]" />
                              </button>
                            </div>
                            <div className="hidden sm:block w-24 text-end font-bold text-sm text-primary whitespace-nowrap">
                              {formatDzd(comp.priceDzd * qty, locale)}
                            </div>
                            <button
                              onClick={() => removeMultiGroup(slot.key as MultiKey, k)}
                              className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                              aria-label={tc("delete")}
                            >
                              <Icon name="close" className="text-[16px]" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline dropdown product list */}
                  {isOpen && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-2 max-h-72 overflow-y-auto">
                      {slotProducts === undefined && (
                        <div className="text-center py-6 text-slate-400 text-sm">
                          {tc("loading")}
                        </div>
                      )}
                      {filteredSlotProducts.map(({ product: p, inStock, selectable, incompatibilityReason }) => {
                        const thumb = (p as any).images?.[0] as string | undefined;
                        // Out of stock is a hard block and takes priority over a compatibility note.
                        const reason = !inStock ? tc("outOfStock") : incompatibilityReason;
                        return (
                        <button
                          key={(p as any)._id}
                          onClick={() => {
                            if (!selectable) return;
                            const comp: ConfigComponent = {
                              _id: (p as any)._id,
                              slug: (p as any).slug,
                              nameFr: (p as any).nameFr,
                              nameAr: (p as any).nameAr,
                              priceDzd: (p as any).priceDzd,
                              specs: (p as any).specs,
                            };
                            if (isMultiSlot(slot.key))
                              addMultiItem(slot.key, comp);
                            else setSingle(slot.key, comp);
                          }}
                          disabled={!selectable}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl ring-1 transition-all text-start ${
                            selectable
                              ? "bg-white ring-slate-200 hover:ring-primary/40 hover:bg-primary/5 cursor-pointer"
                              : "bg-slate-50 ring-slate-100 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className={`relative h-11 w-11 shrink-0 rounded-full overflow-hidden ring-1 ring-slate-200 bg-slate-100 flex items-center justify-center ${selectable ? "" : "opacity-60"}`}>
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt=""
                                fill
                                sizes="44px"
                                className="object-contain p-1"
                              />
                            ) : (
                              <Icon name={SLOT_ICONS[slot.key]} className="text-slate-400 text-[20px]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-sm truncate ${selectable ? "text-slate-900" : "text-slate-400"}`}>
                              {localizedName(p as any, locale)}
                            </div>
                            {(p as any).brand && (
                              <div className="text-xs text-slate-400">{(p as any).brand}</div>
                            )}
                            {reason && (
                              <div className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                                <Icon name={!inStock ? "inventory_2" : "error"} className="text-[12px] shrink-0" />
                                {reason}
                              </div>
                            )}
                          </div>
                          <div className={`font-bold text-sm whitespace-nowrap ${selectable ? "text-primary" : "text-slate-300"}`}>
                            {formatDzd((p as any).priceDzd, locale)}
                          </div>
                        </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* FPS Estimator */}
            <FpsEstimator
              cpuName={selection.cpu?.nameFr}
              gpuName={selection.gpu?.nameFr}
              ramInfo={selection.ram?.[0]?.nameFr}
            />
          </div>
        </div>
      </div>

      <AiChat
        allProducts={allProducts ?? []}
        locale={locale}
        onApplyBuild={(sel) => setSelection(sel)}
        open={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
      />
    </div>
  );
}
