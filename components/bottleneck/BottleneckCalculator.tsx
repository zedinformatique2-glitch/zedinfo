"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/ui/Icon";
import { PartAutocomplete, type PartSelection } from "./PartAutocomplete";
import {
  calculateBottleneck,
  canRunDeterministic,
  type BottleneckInput,
  type Resolution,
  type WorkloadTask,
} from "@/lib/bottleneck-engine";
import { formatDzd, localizedName } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";

const RESOLUTIONS: Resolution[] = ["1080p", "1440p", "4K"];
const TASKS: WorkloadTask[] = ["gaming", "streaming", "content"];

type CalcResult = {
  bottleneckPercent: number;
  bottleneckedComponent: "cpu" | "gpu" | "balanced";
  verdict: string;
  explanation: string;
  confidence: string;
  warnings: { type: string; messageKey?: string; message?: string; values?: Record<string, string | number> }[];
  source: "catalog" | "ai";
  error?: string;
};

function percentColor(pct: number) {
  if (pct < 5) return "text-green-400";
  if (pct < 15) return "text-amber-400";
  return "text-red-400";
}

function verdictBg(pct: number) {
  if (pct < 5) return "bg-green-500/10 ring-green-500/30";
  if (pct < 15) return "bg-amber-500/10 ring-amber-500/30";
  return "bg-red-500/10 ring-red-500/30";
}

export function BottleneckCalculator() {
  const t = useTranslations("bottleneck");
  const locale = useLocale() as Locale;
  const aiEstimate = useAction(api.bottleneckAi.estimate);

  const [cpuSel, setCpuSel] = useState<PartSelection>({ kind: "freeText", product: null, freeText: "" });
  const [gpuSel, setGpuSel] = useState<PartSelection>({ kind: "freeText", product: null, freeText: "" });
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [task, setTask] = useState<WorkloadTask>("gaming");
  const [ramGb, setRamGb] = useState<string>("");
  const [psuWatts, setPsuWatts] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [shake, setShake] = useState(false);

  const hasBoth = (cpuSel.kind === "catalog" || (cpuSel.freeText?.trim() ?? "").length > 0) &&
                  (gpuSel.kind === "catalog" || (gpuSel.freeText?.trim() ?? "").length > 0);

  const sourceCpuId = cpuSel.kind === "catalog" ? cpuSel.product._id : undefined;
  const sourceGpuId = gpuSel.kind === "catalog" ? gpuSel.product._id : undefined;
  const sourceCpuSocket =
    cpuSel.kind === "catalog"
      ? (cpuSel.product.specs as { socket?: string }).socket
      : undefined;
  const sourceCpuTier =
    cpuSel.kind === "catalog"
      ? (cpuSel.product.specs as { tierScore?: number }).tierScore
      : undefined;
  const sourceGpuTierActual =
    gpuSel.kind === "catalog"
      ? (gpuSel.product.specs as { tierScore?: number }).tierScore
      : undefined;

  // ADJUSTMENT (vs plan): meaningful minTierScore floor instead of 0.
  // For catalog-path bottleneck: recommend upgrades whose tierScore is at least the
  // non-bottlenecked component's tierScore (so the recommended part can actually keep up).
  // For AI-path: fall back to a 50 floor (above-average parts only).
  const minTierScore = useMemo(() => {
    if (!result || result.bottleneckedComponent === "balanced") return 0;
    if (result.source === "catalog") {
      if (result.bottleneckedComponent === "cpu" && typeof sourceGpuTierActual === "number") {
        return sourceGpuTierActual;
      }
      if (result.bottleneckedComponent === "gpu" && typeof sourceCpuTier === "number") {
        return sourceCpuTier;
      }
      return 0;
    }
    return 50; // AI path heuristic floor
  }, [result, sourceCpuTier, sourceGpuTierActual]);

  const upgrades = useQuery(
    api.bottleneck.recommendUpgrades,
    result && result.bottleneckedComponent !== "balanced"
      ? {
          bottleneckedComponent: result.bottleneckedComponent,
          minTierScore,
          sourceCpuSocket,
          sourceCpuId,
          sourceGpuId,
          limit: 3,
        }
      : "skip"
  );

  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
  }, []);

  function triggerShake() {
    setShake(true);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setShake(false), 500);
  }

  async function onCalculate() {
    if (!hasBoth) {
      triggerShake();
      return;
    }
    setLoading(true);
    setResult(null);

    const cpuName =
      cpuSel.kind === "catalog"
        ? localizedName({ nameFr: cpuSel.product.nameFr, nameAr: cpuSel.product.nameAr }, locale)
        : cpuSel.freeText ?? "";
    const gpuName =
      gpuSel.kind === "catalog"
        ? localizedName({ nameFr: gpuSel.product.nameFr, nameAr: gpuSel.product.nameAr }, locale)
        : gpuSel.freeText ?? "";

    const ramNum = ramGb ? Number(ramGb) : undefined;
    const psuNum = psuWatts ? Number(psuWatts) : undefined;

    const engineInput: BottleneckInput = {
      cpu: {
        name: cpuName,
        tierScore: cpuSel.kind === "catalog" ? (cpuSel.product.specs as { tierScore?: number }).tierScore : undefined,
        socket: sourceCpuSocket,
        tdp: cpuSel.kind === "catalog" ? (cpuSel.product.specs as { tdp?: number }).tdp : undefined,
      },
      gpu: {
        name: gpuName,
        tierScore: gpuSel.kind === "catalog" ? (gpuSel.product.specs as { tierScore?: number }).tierScore : undefined,
        tdp: gpuSel.kind === "catalog" ? (gpuSel.product.specs as { tdp?: number }).tdp : undefined,
      },
      resolution,
      task,
      ramGb: ramNum,
      psuWatts: psuNum,
    };

    if (canRunDeterministic(engineInput)) {
      const calc = calculateBottleneck(engineInput)!;
      setResult({
        bottleneckPercent: calc.bottleneckPercent,
        bottleneckedComponent: calc.bottleneckedComponent,
        verdict: t(`verdicts.${calc.bottleneckedComponent}`, { percent: calc.bottleneckPercent }),
        explanation: t(`explanations.${calc.bottleneckedComponent}`),
        confidence: "high",
        warnings: calc.warnings.map((w) => ({
          type: w.type,
          messageKey: w.messageKey,
          values: w.values,
        })),
        source: "catalog",
      });
      setLoading(false);
      return;
    }

    try {
      const ai = await aiEstimate({
        cpuName,
        gpuName,
        resolution,
        task,
        locale,
        ramGb: ramNum,
        psuWatts: psuNum,
      });
      if ("error" in ai && ai.error === "invalid_hardware") {
        setResult({
          bottleneckPercent: 0,
          bottleneckedComponent: "balanced",
          verdict: t("invalidHardware"),
          explanation: "",
          confidence: "low",
          warnings: [],
          source: "ai",
          error: "invalid_hardware",
        });
      } else {
        const safeWarnings = (Array.isArray((ai as { warnings?: unknown }).warnings)
          ? ((ai as { warnings: unknown[] }).warnings as Array<{
              type?: unknown;
              message?: unknown;
              messageKey?: unknown;
            }>)
          : []
        )
          .map((w) => ({
            type: String(w.type ?? ""),
            message: typeof w.message === "string" ? w.message : undefined,
            messageKey: typeof w.messageKey === "string" ? w.messageKey : undefined,
          }))
          .filter((w) => w.message || w.messageKey);
        setResult({
          bottleneckPercent: typeof (ai as { bottleneckPercent?: unknown }).bottleneckPercent === "number" ? (ai as { bottleneckPercent: number }).bottleneckPercent : 0,
          bottleneckedComponent: ((ai as { bottleneckedComponent?: unknown }).bottleneckedComponent === "cpu" || (ai as { bottleneckedComponent?: unknown }).bottleneckedComponent === "gpu" || (ai as { bottleneckedComponent?: unknown }).bottleneckedComponent === "balanced") ? (ai as { bottleneckedComponent: "cpu" | "gpu" | "balanced" }).bottleneckedComponent : "balanced",
          verdict: String((ai as { verdict?: unknown }).verdict ?? ""),
          explanation: String((ai as { explanation?: unknown }).explanation ?? ""),
          confidence: String((ai as { confidence?: unknown }).confidence ?? "medium"),
          warnings: safeWarnings,
          source: "ai",
        });
      }
    } catch {
      setResult({
        bottleneckPercent: 0,
        bottleneckedComponent: "balanced",
        verdict: t("error"),
        explanation: "",
        confidence: "low",
        warnings: [],
        source: "ai",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <section className="pt-20 pb-10 text-center px-4">
        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-200 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Icon name="speed" className="text-[18px]" />
          <span className="text-blue-300">{t("badge")}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
          {t("title")}
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className={`rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 p-5 sm:p-6 mb-6 transition-all ${shake ? "animate-shake ring-red-500/60" : ""}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <PartAutocomplete
              specType="cpu"
              value={cpuSel.kind === "catalog" ? localizedName({ nameFr: cpuSel.product.nameFr, nameAr: cpuSel.product.nameAr }, locale) : cpuSel.freeText ?? ""}
              onChange={setCpuSel}
              label={`${t("cpuLabel")} *`}
              placeholder={t("cpuPlaceholder")}
            />
            <PartAutocomplete
              specType="gpu"
              value={gpuSel.kind === "catalog" ? localizedName({ nameFr: gpuSel.product.nameFr, nameAr: gpuSel.product.nameAr }, locale) : gpuSel.freeText ?? ""}
              onChange={setGpuSel}
              label={`${t("gpuLabel")} *`}
              placeholder={t("gpuPlaceholder")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t("resolution")}</div>
              <div className="flex gap-1.5">
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      resolution === r
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t("task")}</div>
              <div className="flex gap-1.5">
                {TASKS.map((tk) => (
                  <button
                    key={tk}
                    type="button"
                    onClick={() => setTask(tk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      task === tk
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    {t(`tasks.${tk}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                {t("ramLabel")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={ramGb}
                onChange={(e) => setRamGb(e.target.value)}
                placeholder={t("ramPlaceholder")}
                className="w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                {t("psuLabel")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={psuWatts}
                onChange={(e) => setPsuWatts(e.target.value)}
                placeholder={t("psuPlaceholder")}
                className="w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onCalculate}
            disabled={loading}
            className="w-full px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
          >
            {loading ? t("calculating") : t("calculate")}
          </button>

          {!hasBoth && shake && (
            <p className="text-red-400 text-sm mt-3 text-center">{t("needCpuGpu")}</p>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 p-8 text-center">
            <div className="animate-spin inline-block w-10 h-10 border-3 border-primary border-t-transparent rounded-full mb-3" />
            <p className="text-sm text-slate-400">{t("calculating")}</p>
          </div>
        )}

        {result && !loading && (
          <div className="rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 p-6 sm:p-8 space-y-5">
            {result.error === "invalid_hardware" ? (
              <p className="text-center text-slate-300">{t("invalidHardware")}</p>
            ) : (
              <>
                <div className="text-center">
                  <div className={`text-6xl sm:text-7xl font-black ${percentColor(result.bottleneckPercent)}`}>
                    {result.bottleneckPercent.toFixed(1)}%
                  </div>
                  <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1">
                    {t(`componentLabels.${result.bottleneckedComponent}`)}
                  </div>
                </div>

                <div className={`rounded-xl ring-1 px-4 py-3 text-sm text-slate-100 ${verdictBg(result.bottleneckPercent)}`}>
                  {result.verdict}
                </div>

                {result.explanation && (
                  <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
                )}

                <div className="flex items-center justify-center gap-3 text-xs">
                  <span className="px-3 py-1 rounded-lg bg-white/10 text-slate-300 font-semibold">
                    {t("confidence")}: {t(`confidenceLabels.${result.confidence}`)}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/10 text-slate-300 font-semibold">
                    {t(`sourceLabels.${result.source}`)}
                  </span>
                </div>

                {result.warnings.filter((w) => w.messageKey || w.message).length > 0 && (
                  <div className="space-y-2">
                    {result.warnings
                      .filter((w) => w.messageKey || w.message)
                      .map((w, i) => (
                        <div key={i} className="flex items-start gap-2 bg-amber-500/10 ring-1 ring-amber-500/30 rounded-xl p-3">
                          <Icon name="warning" className="text-amber-400 text-[18px] shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-100">
                            {w.messageKey ? t(w.messageKey, w.values ?? {}) : w.message}
                          </p>
                        </div>
                      ))}
                  </div>
                )}

                {result.bottleneckedComponent !== "balanced" && upgrades && upgrades.products.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-sm font-bold text-white mb-3">{t("upgrades.heading")}</h3>
                    {upgrades.socketMismatch && (
                      <div className="mb-3 flex items-start gap-2 bg-amber-500/10 ring-1 ring-amber-500/30 rounded-xl p-3">
                        <Icon name="info" className="text-amber-400 text-[18px] shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-100">{t("upgrades.socketMismatch")}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {upgrades.products.map((p) => (
                        <Link
                          key={p._id}
                          href={`/product/${p.slug}`}
                          className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3 hover:ring-primary/50 hover:bg-white/10 transition-all"
                        >
                          <div className="text-xs text-slate-400 mb-1">{p.brand}</div>
                          <div className="text-sm font-semibold text-white mb-2 line-clamp-2">
                            {localizedName(p, locale)}
                          </div>
                          <div className="text-sm font-bold text-primary-200">
                            {formatDzd(p.priceDzd, locale)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {result.bottleneckedComponent === "balanced" && (
                  <div className="text-center text-sm text-slate-300">
                    <p className="mb-3">{t("balancedCta")}</p>
                    <Link
                      href="/shop/graphics-cards"
                      className="inline-flex items-center gap-1 text-primary-200 hover:text-primary-100 font-semibold"
                    >
                      {t("balancedCtaLink")}
                      <Icon name="arrow_forward" className="text-[16px]" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
