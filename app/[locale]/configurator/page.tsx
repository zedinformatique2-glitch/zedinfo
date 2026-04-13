"use client";

import { useMemo, useState } from "react";
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
  type ConfigSelection,
  type ConfigComponent,
} from "@/lib/configurator-engine";
import { AiChat } from "@/components/configurator/AiChat";
import { FpsEstimator } from "@/components/configurator/FpsEstimator";
import type { Locale } from "@/lib/i18n/config";

type SlotKey = (typeof CONFIG_SLOTS)[number]["key"];

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

  function setSingle(key: SlotKey, comp: ConfigComponent) {
    setSelection((s) => ({ ...s, [key]: comp }));
    setOpenSlot(null);
  }

  function setRam(comp: ConfigComponent) {
    setSelection((s) => ({ ...s, ram: [comp] }));
    setOpenSlot(null);
  }

  function setStorage(comp: ConfigComponent) {
    setSelection((s) => ({ ...s, storage: [comp] }));
    setOpenSlot(null);
  }

  function clearSlot(key: SlotKey) {
    setSelection((s) => {
      const next = { ...s };
      delete (next as any)[key];
      return next;
    });
  }

  async function onSave() {
    const ids: string[] = [];
    if (selection.cpu?._id) ids.push(selection.cpu._id);
    if (selection.motherboard?._id) ids.push(selection.motherboard._id);
    selection.ram?.forEach((r) => r._id && ids.push(r._id));
    if (selection.gpu?._id) ids.push(selection.gpu._id);
    selection.storage?.forEach((s) => s._id && ids.push(s._id));
    if (selection.psu?._id) ids.push(selection.psu._id);
    if (selection.case?._id) ids.push(selection.case._id);
    if (selection.cooler?._id) ids.push(selection.cooler._id);
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
      selection.cooler,
    ].filter((c): c is ConfigComponent => !!c);
    comps.forEach((c) => {
      addToCart({
        productId: c._id,
        slug: c.slug,
        nameFr: c.nameFr,
        nameAr: c.nameAr,
        priceDzd: c.priceDzd,
        image: "",
      });
    });
  }

  const slotComponent = (key: SlotKey): ConfigComponent | undefined => {
    if (key === "ram") return selection.ram?.[0];
    if (key === "storage") return selection.storage?.[0];
    return (selection as any)[key];
  };

  const selectedCount = CONFIG_SLOTS.filter((s) => !!slotComponent(s.key)).length;

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
                  const current = slotComponent(slot.key);
                  return (
                    <div key={slot.key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{t(`steps.${slot.key}` as any)}</span>
                      <span className={current ? "font-semibold text-slate-900" : "text-slate-300"}>
                        {current ? formatDzd(current.priceDzd, locale) : "---"}
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
              const current = slotComponent(slot.key);
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
                      {current ? t("change") : t("select")}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm sm:text-base">
                        {t(`steps.${slot.key}` as any)}
                      </div>
                      {current ? (
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
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">{t("notSelected")}</p>
                      )}
                    </div>

                    {/* Icon */}
                    <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Icon name={SLOT_ICONS[slot.key]} className="text-[22px]" />
                    </div>
                  </div>

                  {/* Inline dropdown product list */}
                  {isOpen && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-2 max-h-72 overflow-y-auto">
                      {slotProducts === undefined && (
                        <div className="text-center py-6 text-slate-400 text-sm">
                          {tc("loading")}
                        </div>
                      )}
                      {slotProducts?.map((p: any) => (
                        <button
                          key={p._id}
                          onClick={() => {
                            const comp: ConfigComponent = {
                              _id: p._id,
                              slug: p.slug,
                              nameFr: p.nameFr,
                              nameAr: p.nameAr,
                              priceDzd: p.priceDzd,
                              specs: p.specs,
                            };
                            if (slot.key === "ram") setRam(comp);
                            else if (slot.key === "storage") setStorage(comp);
                            else setSingle(slot.key, comp);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-white ring-1 ring-slate-200 hover:ring-primary/40 hover:bg-primary/5 transition-all text-start"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate text-slate-900">
                              {localizedName(p, locale)}
                            </div>
                            {p.brand && (
                              <div className="text-xs text-slate-400">{p.brand}</div>
                            )}
                          </div>
                          <div className="text-primary font-bold text-sm whitespace-nowrap">
                            {formatDzd(p.priceDzd, locale)}
                          </div>
                        </button>
                      ))}
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
