"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart-store";
import { fbTrack, fbContents, FB_CURRENCY } from "@/lib/fb-pixel";
import { formatDzd, localizedName } from "@/lib/format";
import {
  CONFIG_SLOTS,
  checkCompatibility,
  filterCompatibleProducts,
  type ConfigSelection,
  type ConfigComponent,
  type SlotKey,
} from "@/lib/configurator-engine";
import {
  selectionToItems,
  itemsToSelection,
  isValidShareCode,
  type BuildItem,
  type CatalogProduct,
} from "@/lib/saved-build";

// The build in progress is remembered in the browser (like the cart) so a visitor
// who leaves and comes back finds their parts still selected.
const STORAGE_KEY = "zed-configurator-build-v1";

function readStoredItems(): BuildItem[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
import { AiChat } from "@/components/configurator/AiChat";
import { FpsEstimator } from "@/components/configurator/FpsEstimator";
import type { Locale } from "@/lib/i18n/config";
import { useRouter } from "@/lib/i18n/routing";


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

/** A few short, readable spec chips (socket, RAM type, wattage…) for a chosen part. */
function specChips(specs: any): string[] {
  if (!specs) return [];
  const out: string[] = [];
  const push = (v: unknown, suffix = "") => {
    if (Array.isArray(v)) v = v.filter(Boolean).join(" / ");
    if (typeof v === "string" && v.trim()) out.push(`${v.trim()}${suffix}`);
    else if (typeof v === "number" && v > 0) out.push(`${v}${suffix}`);
  };
  // Coolers list a dozen sockets — keep the chip short.
  const sockets = Array.isArray(specs.socket)
    ? specs.socket
    : typeof specs.socket === "string" ? specs.socket.split(/\s*[/,;]\s*/) : [];
  if (sockets.length > 3) push(`${sockets.slice(0, 3).join(" / ")} +${sockets.length - 3}`);
  else push(specs.socket);
  push(specs.cores, "C");
  push(specs.ramType);
  push(specs.sizeGb, " GB");
  push(specs.speed, " MHz");
  push(specs.capacity);
  push(specs.interface);
  push(specs.wattage, " W");
  push(specs.rating);
  push(specs.formFactor);
  push(specs.lengthMm, " mm");
  push(specs.tdp, " W TDP");
  return [...new Set(out)].slice(0, 4);
}

export default function ConfiguratorPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations("configurator");
  const tc = useTranslations("common");

  const [selection, setSelection] = useState<ConfigSelection>({});
  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
  // The saved link only stays on screen while the build matches what was saved.
  const [saved, setSaved] = useState<{ code: string; itemsKey: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  // `?build=CODE` from a saved link, read once on the client.
  const [urlCode, setUrlCode] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [notice, setNotice] = useState<
    { kind: "loaded" | "restored" | "notFound"; skipped: number } | null
  >(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState<{ src: string; name: string } | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const allProducts = useQuery(api.products.list, {});

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("build");
    if (code && isValidShareCode(code)) setUrlCode(code.toUpperCase());
    else setUrlCode("");
  }, []);

  const sharedBuild = useQuery(api.configurator.byCode, urlCode ? { code: urlCode } : "skip");

  // Restore once: a saved link wins over the build remembered in this browser.
  useEffect(() => {
    if (restored || urlCode === null || !allProducts) return;
    if (urlCode && sharedBuild === undefined) return;
    const catalog = new Map(
      (allProducts as unknown as CatalogProduct[]).map((p) => [p._id, p])
    );
    const fromLink = urlCode ? sharedBuild?.items ?? null : null;
    const items = fromLink ?? readStoredItems();
    if (items && items.length > 0) {
      const { selection: sel, skipped } = itemsToSelection(items, catalog);
      setSelection(sel);
      setNotice({ kind: fromLink ? "loaded" : "restored", skipped });
    }
    if (urlCode && !sharedBuild) setNotice({ kind: "notFound", skipped: 0 });
    setRestored(true);
  }, [restored, urlCode, sharedBuild, allProducts]);

  const currentItems = useMemo(() => selectionToItems(selection), [selection]);
  const currentItemsKey = JSON.stringify(currentItems);

  useEffect(() => {
    if (!restored) return;
    try {
      if (currentItems.length) window.localStorage.setItem(STORAGE_KEY, currentItemsKey);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Private mode / storage blocked: the build just isn't remembered.
    }
  }, [restored, currentItems.length, currentItemsKey]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const savedLink =
    saved && saved.itemsKey === currentItemsKey && typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/configurator?build=${saved.code}`
      : null;

  function clearBuild() {
    setSelection({});
    setSaved(null);
    setNotice(null);
    setOpenSlot(null);
    if (window.location.search.includes("build=")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  async function copyLink() {
    if (!savedLink) return;
    try {
      await navigator.clipboard.writeText(savedLink);
      setCopied(true);
    } catch {
      // Clipboard blocked — the link is still visible and selectable.
    }
  }
  const saveBuild = useMutation(api.configurator.saveBuild);
  const addToCart = useCart((s) => s.add);
  const router = useRouter();

  const openSlotMeta = openSlot
    ? CONFIG_SLOTS.find((s) => s.key === openSlot)
    : null;

  const slotProducts = useQuery(
    api.products.list,
    openSlotMeta ? { categorySlug: openSlotMeta.categorySlug } : "skip"
  );

  const result = useMemo(() => checkCompatibility(selection), [selection]);

  // Chosen parts only carry name/price/specs, so photos and brands are looked up
  // from the catalog. This also covers builds applied by the AI assistant.
  const productById = useMemo(() => {
    const m = new Map<string, any>();
    for (const p of [...(allProducts ?? []), ...(slotProducts ?? [])] as any[]) {
      m.set(p._id, p);
      m.set(p.slug, p);
    }
    return m;
  }, [allProducts, slotProducts]);
  const docOf = (c?: ConfigComponent) =>
    c ? productById.get(c._id ?? "") ?? productById.get(c.slug) : undefined;
  const imageOf = (c?: ConfigComponent): string | undefined => docOf(c)?.images?.[0];

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  useEffect(() => {
    if (!justAdded) return;
    const id = setTimeout(() => setJustAdded(false), 2500);
    return () => clearTimeout(id);
  }, [justAdded]);

  const filteredSlotProducts = useMemo(() => {
    if (!slotProducts || !openSlot) return [];
    const q = search.trim().toLowerCase();
    const matching = q
      ? (slotProducts as any[]).filter((p) =>
          [p.nameFr, p.nameAr, p.brand].some((s) => typeof s === "string" && s.toLowerCase().includes(q))
        )
      : (slotProducts as any[]);
    const filtered = filterCompatibleProducts(matching, selection, openSlot).map((f) => {
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
  }, [slotProducts, openSlot, selection, search]);

  function toggleSlot(key: SlotKey) {
    setSearch("");
    setOpenSlot((cur) => (cur === key ? null : key));
  }

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
    if (currentItems.length === 0 || saving) return;
    setSaving(true);
    try {
      const res = await saveBuild({
        componentIds: currentItems.map((i) => i.productId) as any,
        totalDzd: result.totalPrice,
        items: currentItems as any,
      });
      setSaved({ code: res.shareCode, itemsKey: currentItemsKey });
    } finally {
      setSaving(false);
    }
  }

  function addAllToCart(sel: ConfigSelection = selection) {
    const comps = [
      sel.cpu,
      sel.motherboard,
      ...(sel.ram ?? []),
      sel.gpu,
      ...(sel.storage ?? []),
      sel.psu,
      sel.case,
      ...(sel.cooler ?? []),
    ].filter((c): c is ConfigComponent => !!c);
    comps.forEach((c) => {
      addToCart(
        {
          productId: c._id,
          slug: c.slug,
          nameFr: c.nameFr,
          nameAr: c.nameAr,
          priceDzd: c.priceDzd,
          image: imageOf(c) ?? "",
          fromBuild: true,
        },
        1,
        // One aggregate AddToCart is fired below for the whole build instead of
        // ~8 separate events, which would wreck the ads reporting.
        { silent: true },
      );
    });

    if (comps.length > 0) {
      fbTrack("AddToCart", {
        ...fbContents(comps.map((c) => ({ slug: c.slug, priceDzd: c.priceDzd, qty: 1 }))),
        content_name: "Custom PC build",
        value: comps.reduce((sum, c) => sum + c.priceDzd, 0),
        currency: FB_CURRENCY,
      });
      setJustAdded(true);
    }
  }

  const slotComponent = (key: SlotKey): ConfigComponent | undefined => {
    if (key === "ram") return selection.ram?.[0];
    if (key === "storage") return selection.storage?.[0];
    if (key === "cooler") return selection.cooler?.[0];
    return (selection as any)[key];
  };

  const selectedCount = CONFIG_SLOTS.filter((s) => slotFilled(s.key)).length;
  const progressPct = Math.round((selectedCount / CONFIG_SLOTS.length) * 100);
  const stepName = (key: SlotKey) => t(`steps.${key}` as any);

  /** Big photo tile + details for one chosen part. `qty` is set for multi slots. */
  function renderChosen(slotKey: SlotKey, comp: ConfigComponent, qty?: number) {
    const img = imageOf(comp);
    const doc = docOf(comp);
    const name = localizedName(comp, locale);
    const chips = specChips(comp.specs);
    const k = itemKey(comp);
    return (
      <div key={k} className="flex items-center gap-4 sm:gap-6 border-t border-slate-100 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => img && setZoom({ src: img, name })}
          disabled={!img}
          aria-label={t("zoom")}
          className="group relative h-28 w-28 sm:h-36 sm:w-36 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200 disabled:cursor-default"
        >
          {img ? (
            <>
              <Image
                src={img}
                alt=""
                fill
                sizes="144px"
                className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-2 end-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-slate-600 shadow-sm ring-1 ring-slate-200 opacity-80 transition-opacity group-hover:opacity-100">
                <Icon name="zoom_in" className="text-[18px]" />
              </span>
            </>
          ) : (
            <span className="flex h-full w-full items-center justify-center text-slate-300">
              <Icon name={SLOT_ICONS[slotKey]} className="text-[40px]" />
            </span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {doc?.brand && (
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{doc.brand}</div>
          )}
          <div className="mt-0.5 font-bold text-slate-900 leading-snug line-clamp-2 sm:text-lg">{name}</div>
          {chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span key={c} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                  {c}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-lg font-black text-primary whitespace-nowrap">
              {formatDzd(comp.priceDzd * (qty ?? 1), locale)}
            </span>
            {qty !== undefined && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => decMultiItem(slotKey as MultiKey, k)}
                  className="flex h-8 w-8 items-center justify-center rounded-md ring-1 ring-slate-200 text-slate-600 hover:bg-slate-100"
                  aria-label="-"
                >
                  <Icon name="remove" className="text-[16px]" />
                </button>
                <span className="w-7 text-center text-sm font-bold tabular-nums">{qty}</span>
                <button
                  onClick={() => incMultiItem(slotKey as MultiKey, k)}
                  className="flex h-8 w-8 items-center justify-center rounded-md ring-1 ring-slate-200 text-slate-600 hover:bg-slate-100"
                  aria-label="+"
                >
                  <Icon name="add" className="text-[16px]" />
                </button>
              </div>
            )}
            <button
              onClick={() =>
                qty !== undefined ? removeMultiGroup(slotKey as MultiKey, k) : clearSlot(slotKey)
              }
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors hover:text-red-500"
            >
              <Icon name="delete" className="text-[16px]" />
              {t("remove")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="container-zed py-10 lg:py-14">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl lg:text-5xl font-black tracking-tight">
              <span className="text-primary">{t("title").split(" ")[0]}</span>{" "}
              {t("title").split(" ").slice(1).join(" ")}
            </h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">{t("subtitle")}</p>
          </div>

          {/* Mobile/tablet progress — on desktop the sticky summary shows it */}
          <div className="lg:hidden rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200 md:min-w-[280px]">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600">
                {t("progress", { count: selectedCount, total: CONFIG_SLOTS.length })}
              </span>
              <span className="font-black text-primary">{formatDzd(result.totalPrice, locale)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
          {/* Slot cards + FPS estimator */}
          <div className="space-y-4 min-w-0">
            {notice && (
              <div
                className={`flex items-start gap-3 rounded-2xl p-4 ring-1 ${
                  notice.kind === "notFound"
                    ? "bg-amber-50 ring-amber-200 text-amber-800"
                    : "bg-primary/5 ring-primary/15 text-slate-700"
                }`}
              >
                <Icon
                  name={notice.kind === "notFound" ? "link_off" : notice.kind === "loaded" ? "link" : "history"}
                  className={`mt-px shrink-0 text-[20px] ${notice.kind === "notFound" ? "text-amber-500" : "text-primary"}`}
                />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">
                    {notice.kind === "notFound"
                      ? t("buildNotFound")
                      : notice.kind === "loaded"
                        ? t("buildLoaded")
                        : t("buildRestored")}
                  </p>
                  {notice.skipped > 0 && (
                    <p className="mt-0.5 text-xs text-slate-500">{t("partsSkipped", { count: notice.skipped })}</p>
                  )}
                </div>
                {notice.kind === "restored" && (
                  <button
                    onClick={clearBuild}
                    className="shrink-0 text-xs font-bold text-primary hover:underline"
                  >
                    {t("startOver")}
                  </button>
                )}
                <button
                  onClick={() => setNotice(null)}
                  aria-label={t("close")}
                  className="shrink-0 text-slate-400 hover:text-slate-700"
                >
                  <Icon name="close" className="text-[18px]" />
                </button>
              </div>
            )}

            {CONFIG_SLOTS.map((slot, i) => {
              const multi = isMultiSlot(slot.key);
              const current = multi ? undefined : slotComponent(slot.key);
              const groups = multi ? groupItems((selection as any)[slot.key]) : [];
              const filled = slotFilled(slot.key);
              const isOpen = openSlot === slot.key;
              const chosenIds = new Set(
                multi ? groups.map((g) => itemKey(g.comp)) : current ? [itemKey(current)] : []
              );
              return (
                <section
                  key={slot.key}
                  className={`rounded-2xl bg-white shadow-card transition-shadow ${
                    isOpen ? "ring-2 ring-primary/40" : filled ? "ring-1 ring-primary/25" : "ring-1 ring-slate-200"
                  }`}
                >
                  {/* Slot header row */}
                  <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                        filled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Icon name={filled ? "check_circle" : SLOT_ICONS[slot.key]} className="text-[22px]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="text-[11px] font-bold text-slate-300 tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h2 className="font-bold text-slate-900 sm:text-lg">{stepName(slot.key)}</h2>
                        {!slot.required && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            {t("optional")}
                          </span>
                        )}
                      </div>
                      {!filled && <p className="text-xs text-slate-400 mt-0.5">{t("notSelected")}</p>}
                      {filled && multi && (
                        <p className="text-xs font-semibold text-primary mt-0.5">
                          {formatDzd(slotTotal(slot.key), locale)}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => toggleSlot(slot.key)}
                      aria-expanded={isOpen}
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                        filled
                          ? "bg-white text-primary ring-1 ring-primary/30 hover:bg-primary/5"
                          : "bg-primary text-white shadow-[0_8px_20px_-8px_rgba(0,53,208,0.55)] hover:-translate-y-0.5 hover:brightness-110"
                      }`}
                    >
                      <Icon
                        name={isOpen ? "expand_less" : multi && filled ? "add" : filled ? "swap_horiz" : "add"}
                        className="text-[18px]"
                      />
                      <span>
                        {multi
                          ? filled ? t("addAnother") : t("select")
                          : current ? t("change") : t("select")}
                      </span>
                    </button>
                  </div>

                  {/* Chosen part(s) with big photos */}
                  {!multi && current && renderChosen(slot.key, current)}
                  {multi && groups.map(({ comp, qty }) => renderChosen(slot.key, comp, qty))}

                  {/* Product picker */}
                  {isOpen && (
                    <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="relative flex-1">
                          <Icon
                            name="search"
                            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400"
                          />
                          <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("searchPlaceholder")}
                            className="w-full rounded-xl bg-white py-2.5 pe-3 ps-10 text-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>
                        <button
                          onClick={() => setOpenSlot(null)}
                          aria-label={t("close")}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-900"
                        >
                          <Icon name="close" className="text-[20px]" />
                        </button>
                      </div>

                      {slotProducts === undefined && (
                        <div className="py-10 text-center text-sm text-slate-400">{tc("loading")}</div>
                      )}
                      {slotProducts !== undefined && filteredSlotProducts.length === 0 && (
                        <div className="py-10 text-center text-sm text-slate-400">{t("noResults")}</div>
                      )}

                      <div className="-m-1 max-h-[34rem] overflow-y-auto p-1">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                          {filteredSlotProducts.map(({ product: p, inStock, selectable, incompatibilityReason }) => {
                            const pa = p as any;
                            const thumb = pa.images?.[0] as string | undefined;
                            // Out of stock is a hard block and takes priority over a compatibility note.
                            const reason = !inStock ? tc("outOfStock") : incompatibilityReason;
                            const isChosen = chosenIds.has(pa._id) || chosenIds.has(pa.slug);
                            return (
                              <button
                                key={pa._id}
                                onClick={() => {
                                  if (!selectable) return;
                                  const comp: ConfigComponent = {
                                    _id: pa._id,
                                    slug: pa.slug,
                                    nameFr: pa.nameFr,
                                    nameAr: pa.nameAr,
                                    priceDzd: pa.priceDzd,
                                    specs: pa.specs,
                                  };
                                  if (isMultiSlot(slot.key)) addMultiItem(slot.key, comp);
                                  else setSingle(slot.key, comp);
                                }}
                                disabled={!selectable}
                                className={`group flex flex-col overflow-hidden rounded-2xl bg-white text-start ring-1 transition-all ${
                                  selectable
                                    ? `cursor-pointer shadow-card hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-primary/40 ${
                                        isChosen ? "ring-2 ring-primary" : "ring-slate-200"
                                      }`
                                    : "cursor-not-allowed ring-slate-100 opacity-60"
                                }`}
                              >
                                <div className="relative aspect-square w-full bg-gradient-to-br from-slate-50 to-slate-100">
                                  {thumb ? (
                                    <Image
                                      src={thumb}
                                      alt=""
                                      fill
                                      sizes="(min-width: 1280px) 200px, (min-width: 640px) 30vw, 45vw"
                                      className={`object-contain p-4 transition-transform duration-300 ${
                                        selectable ? "group-hover:scale-105" : "grayscale"
                                      }`}
                                    />
                                  ) : (
                                    <span className="flex h-full items-center justify-center text-slate-300">
                                      <Icon name={SLOT_ICONS[slot.key]} className="text-[40px]" />
                                    </span>
                                  )}
                                  {isChosen && (
                                    <span className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow">
                                      <Icon name="check" className="text-[18px]" />
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-1 flex-col p-3">
                                  {pa.brand && (
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                      {pa.brand}
                                    </div>
                                  )}
                                  <div
                                    className={`text-[13px] font-semibold leading-snug line-clamp-2 ${
                                      selectable ? "text-slate-900" : "text-slate-400"
                                    }`}
                                  >
                                    {localizedName(pa, locale)}
                                  </div>
                                  {reason && (
                                    <div className="mt-1 flex items-start gap-1 text-[11px] text-red-500">
                                      <Icon
                                        name={!inStock ? "inventory_2" : "error"}
                                        className="mt-px shrink-0 text-[12px]"
                                      />
                                      <span className="line-clamp-2">{reason}</span>
                                    </div>
                                  )}
                                  <div
                                    className={`mt-auto pt-2 font-black whitespace-nowrap ${
                                      selectable ? "text-primary" : "text-slate-300"
                                    }`}
                                  >
                                    {formatDzd(pa.priceDzd, locale)}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}

            {/* FPS Estimator */}
            <FpsEstimator
              cpuName={selection.cpu?.nameFr}
              gpuName={selection.gpu?.nameFr}
              ramInfo={selection.ram?.[0]?.nameFr}
            />
          </div>

          {/* Build summary */}
          <aside className="min-w-0 lg:sticky lg:top-24">
            <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-slate-200 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">{t("buildSummary")}</h2>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary tabular-nums">
                  {selectedCount}/{CONFIG_SLOTS.length}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>

              <ul className="mt-4 space-y-1">
                {CONFIG_SLOTS.map((slot) => {
                  const filled = slotFilled(slot.key);
                  const first = slotComponent(slot.key);
                  const count = isMultiSlot(slot.key) ? (selection[slot.key]?.length ?? 0) : filled ? 1 : 0;
                  const img = imageOf(first);
                  return (
                    <li key={slot.key}>
                      <button
                        onClick={() => toggleSlot(slot.key)}
                        className="flex w-full items-center gap-3 rounded-lg p-1 text-start transition-colors hover:bg-slate-50"
                      >
                        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-200 text-slate-300">
                          {img ? (
                            <Image src={img} alt="" fill sizes="40px" className="object-contain p-1" />
                          ) : (
                            <Icon name={SLOT_ICONS[slot.key]} className="text-[20px]" />
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[11px] text-slate-400">{stepName(slot.key)}</span>
                          <span
                            className={`block truncate text-[13px] ${
                              filled ? "font-semibold text-slate-900" : "text-slate-300"
                            }`}
                          >
                            {first ? localizedName(first, locale) : "—"}
                            {count > 1 && <span className="text-slate-400"> ×{count}</span>}
                          </span>
                        </span>
                        {filled && (
                          <span className="text-[13px] font-bold text-slate-700 whitespace-nowrap">
                            {formatDzd(slotTotal(slot.key), locale)}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Compatibility status */}
              {result.errors.length > 0 && (
                <div className="mt-4 space-y-2 rounded-2xl bg-red-50 p-3">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                      <Icon name="error" className="mt-px shrink-0 text-[16px] text-red-500" />
                      {e}
                    </div>
                  ))}
                </div>
              )}
              {result.warnings.length > 0 && (
                <div className="mt-3 space-y-2 rounded-2xl bg-amber-50 p-3">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                      <Icon name="warning" className="mt-px shrink-0 text-[16px] text-amber-500" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
              {selectedCount > 1 && result.errors.length === 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                  <Icon name="verified" className="text-[18px] text-emerald-600" />
                  {t("compatibleBuild")}
                </div>
              )}

              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="flex items-end justify-between">
                  <span className="font-bold text-slate-600">{t("totalPrice")}</span>
                  <span className="text-2xl font-black text-primary">{formatDzd(result.totalPrice, locale)}</span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <Button className="w-full" size="sm" onClick={() => addAllToCart()} disabled={selectedCount === 0}>
                  <Icon name={justAdded ? "check" : "shopping_cart"} className="text-[18px]" />
                  {justAdded ? t("added") : tc("addToCart")}
                </Button>
                <Button
                  className="w-full"
                  size="sm"
                  variant="outline"
                  onClick={onSave}
                  disabled={selectedCount === 0 || saving || !!savedLink}
                >
                  <Icon name={savedLink ? "check" : "bookmark"} className="text-[18px]" />
                  {savedLink ? t("savedTitle") : t("saveBuild")}
                </Button>
                <button
                  onClick={() => setAiChatOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <Icon name="smart_toy" className="text-[18px]" />
                  {t("aiAssistant")}
                </button>
              </div>

              {savedLink && (
                <div className="mt-4 rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/15">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Icon name="bookmark_added" className="text-[20px] text-primary" />
                    {t("savedTitle")}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{t("savedHint")}</p>
                  <input
                    readOnly
                    value={savedLink}
                    onFocus={(e) => e.currentTarget.select()}
                    dir="ltr"
                    className="mt-3 w-full rounded-xl bg-white px-3 py-2 font-mono text-xs text-slate-700 ring-1 ring-slate-200 outline-none"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={copyLink}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-primary ring-1 ring-primary/30 hover:bg-primary/5"
                    >
                      <Icon name={copied ? "check" : "content_copy"} className="text-[16px]" />
                      {copied ? t("copied") : t("copyLink")}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${t("whatsappText")} ${savedLink}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white hover:brightness-105"
                    >
                      <Icon name="send" className="text-[16px]" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {selectedCount > 0 && (
                <button
                  onClick={clearBuild}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-red-500"
                >
                  <Icon name="restart_alt" className="text-[16px]" />
                  {t("clearBuild")}
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Full-size photo of a chosen part */}
      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoom.name}
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl bg-white p-5 sm:p-8 shadow-2xl"
          >
            <button
              onClick={() => setZoom(null)}
              aria-label={t("close")}
              className="absolute end-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Icon name="close" className="text-[22px]" />
            </button>
            <div className="relative mx-auto aspect-square w-full max-h-[70vh]">
              <Image src={zoom.src} alt={zoom.name} fill sizes="672px" className="object-contain" />
            </div>
            <p className="mt-4 text-center font-bold text-slate-900">{zoom.name}</p>
          </div>
        </div>
      )}

      <AiChat
        allProducts={allProducts ?? []}
        locale={locale}
        onApplyBuild={(sel) => setSelection(sel)}
        onOrderBuild={(sel, extras) => {
          if (Object.keys(sel).length > 0) {
            setSelection(sel);
            addAllToCart(sel);
          }
          // Ready-made PCs and accessories go in as normal products (they fire their own AddToCart).
          extras.forEach(({ product: p, qty }) =>
            addToCart(
              {
                productId: p._id,
                slug: p.slug,
                nameFr: p.nameFr,
                nameAr: p.nameAr,
                priceDzd: p.priceDzd,
                image: p.images?.[0] ?? "",
              },
              qty
            )
          );
          router.push("/checkout");
        }}
        open={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
      />
    </div>
  );
}
