"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/ui/Icon";
import { HardwareInput } from "@/components/fps-estimator/HardwareInput";
import { ToolCrossPromo } from "./ToolCrossPromo";
import { CPUS, GPUS, type Cpu, type Gpu, type FpsResolution } from "@/lib/fps-data";
import { findCpu, findGpu } from "@/lib/fps-engine";
import { analyzeBalance, pickUpgrades, type BalanceResult, type Verdict, type Workload } from "@/lib/balance-engine";
import { formatDzd, localizedName } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";

const RESOLUTIONS: FpsResolution[] = ["1080p", "1440p", "4K"];
const TASKS: Workload[] = ["gaming", "streaming", "content"];
const RAM_OPTIONS = [8, 16, 32, 64] as const;
const PSU_OPTIONS = [450, 550, 650, 750, 850, 1000] as const;

const BUILDS = [
  { cpu: "r5-3600", gpu: "rtx-4070" },
  { cpu: "i5-12400f", gpu: "rtx-3060" },
  { cpu: "i3-12100f", gpu: "gtx-1650" },
  { cpu: "r7-7800x3d", gpu: "rtx-4090" },
];

const VERDICT_COLOR: Record<Verdict, string> = { balanced: "#22c55e", cpu: "#f97316", gpu: "#f59e0b" };
const shortCpu = (name: string) => name.replace(/^(Intel Core|AMD) /, "");

export function BottleneckCalculator() {
  const t = useTranslations("bottleneck");

  const [cpu, setCpu] = useState<Cpu | null>(null);
  const [gpu, setGpu] = useState<Gpu | null>(null);
  const [resolution, setResolution] = useState<FpsResolution>("1080p");
  const [task, setTask] = useState<Workload>("gaming");
  const [ram, setRam] = useState<number>(16);
  const [psu, setPsu] = useState<number | null>(null);

  const result = useMemo(
    () =>
      cpu && gpu
        ? analyzeBalance({ cpuId: cpu.id, gpuId: gpu.id, resolution, task, ramGb: ram, psuWatts: psu ?? undefined })
        : null,
    [cpu, gpu, resolution, task, ram, psu]
  );

  function applyBuild(b: (typeof BUILDS)[number]) {
    setCpu(findCpu(b.cpu) ?? null);
    setGpu(findGpu(b.gpu) ?? null);
  }
  const buildActive = (b: (typeof BUILDS)[number]) => cpu?.id === b.cpu && gpu?.id === b.gpu;
  const stepDone = [!!cpu && !!gpu, true, !!result];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] max-w-[160vw] rounded-full bg-primary/30 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />

      {/* Hero */}
      <section className="relative pt-16 sm:pt-20 pb-8 sm:pb-10 text-center px-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-4 py-1.5 text-xs font-bold text-primary-fixed-dim mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t("badge")}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 max-w-4xl mx-auto">{t("title")}</h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">{t("subtitle")}</p>

        <ol className="mt-8 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
          {(["stepPc", "stepUse", "stepResult"] as const).map((k, i) => (
            <li key={k} className="flex items-center gap-2 sm:gap-3">
              <span
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-semibold ring-1 transition-colors ${
                  stepDone[i] && stepDone[0] ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" : "bg-white/5 text-slate-400 ring-white/10"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${
                    stepDone[i] && stepDone[0] ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-300"
                  }`}
                >
                  {stepDone[i] && stepDone[0] ? <Icon name="check" className="text-[14px]" /> : i + 1}
                </span>
                {t(k)}
              </span>
              {i < 2 && <span className="hidden sm:block h-px w-6 bg-white/15" />}
            </li>
          ))}
        </ol>
      </section>

      <div className="relative max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
        {/* ───────── Left: inputs ───────── */}
        <div className="space-y-6 min-w-0">
          <section className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-5 sm:p-6">
            <StepHeading n={1} title={t("step1Title")} hint={t("step1Hint")} />
            <div className="grid sm:grid-cols-2 gap-3">
              <HardwareInput
                items={CPUS}
                icon="memory"
                label={t("cpuLabel")}
                placeholder={t("cpuPlaceholder")}
                selected={cpu}
                onSelect={setCpu}
                noMatch={t("noMatch")}
                popularLabel={t("popularLabel")}
              />
              <HardwareInput
                items={GPUS}
                icon="developer_board"
                label={t("gpuLabel")}
                placeholder={t("gpuPlaceholder")}
                selected={gpu}
                onSelect={setGpu}
                noMatch={t("noMatch")}
                popularLabel={t("popularLabel")}
              />
            </div>
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("examplesLabel")}</div>
              <div className="flex flex-wrap gap-2">
                {BUILDS.map((b) => (
                  <button
                    key={b.cpu + b.gpu}
                    type="button"
                    onClick={() => applyBuild(b)}
                    aria-pressed={buildActive(b)}
                    className={`rounded-xl px-3 py-2 text-start ring-1 transition-all ${
                      buildActive(b) ? "bg-primary/30 ring-primary-fixed-dim" : "bg-white/[0.04] ring-white/10 hover:ring-primary-container/60 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{findGpu(b.gpu)?.name}</div>
                    <div className="text-[11px] text-slate-400">{shortCpu(findCpu(b.cpu)?.name ?? "")}</div>
                  </button>
                ))}
              </div>
            </div>
            {cpu && gpu && (
              <a
                href="#bn-result"
                className="lg:hidden mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white shadow-lg shadow-primary/30"
              >
                {t("seeResult")}
                <Icon name="arrow_downward" className="text-[18px]" />
              </a>
            )}
          </section>

          <section className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-5 sm:p-6 space-y-5">
            <StepHeading n={2} title={t("step2Title")} hint={t("step2Hint")} flush />
            <Row label={t("resolution")}>
              <div className="inline-flex rounded-xl bg-black/30 ring-1 ring-white/10 p-1">
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    aria-pressed={resolution === r}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      resolution === r ? "bg-primary text-white shadow-lg shadow-primary/40" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Row>
            <Row label={t("task")}>
              <div className="flex flex-wrap gap-1.5">
                {TASKS.map((k) => (
                  <Chip key={k} active={task === k} onClick={() => setTask(k)}>
                    {t(`tasks.${k}`)}
                  </Chip>
                ))}
              </div>
            </Row>
            <Row label={t("ramLabel")}>
              <div className="flex flex-wrap gap-1.5">
                {RAM_OPTIONS.map((r) => (
                  <Chip key={r} active={ram === r} onClick={() => setRam(r)}>
                    {t("ramValue", { gb: r })}
                  </Chip>
                ))}
              </div>
            </Row>
            <Row label={t("psuLabel")}>
              <div className="flex flex-wrap gap-1.5">
                <Chip active={psu === null} onClick={() => setPsu(null)}>
                  {t("psuUnknown")}
                </Chip>
                {PSU_OPTIONS.map((w) => (
                  <Chip key={w} active={psu === w} onClick={() => setPsu(w)}>
                    {w === 1000 ? "1000 W+" : `${w} W`}
                  </Chip>
                ))}
              </div>
            </Row>
          </section>
        </div>

        {/* ───────── Right: result ───────── */}
        <aside id="bn-result" className="min-w-0 lg:sticky lg:top-24 scroll-mt-24">
          <div className="rounded-3xl bg-slate-900/80 ring-1 ring-white/10 shadow-2xl p-6">
            {result && cpu && gpu ? (
              <ResultView result={result} cpu={cpu} gpu={gpu} resolution={resolution} task={task} onResolution={setResolution} t={t} />
            ) : (
              <EmptyState t={t} />
            )}
          </div>
        </aside>
      </div>

      <div className="relative px-4 pb-16">
        <ToolCrossPromo target="fps" />
      </div>
    </div>
  );
}

/* ───────────────────────── pieces ───────────────────────── */

type T = ReturnType<typeof useTranslations<"bottleneck">>;

function StepHeading({ n, title, hint, flush }: { n: number; title: string; hint: string; flush?: boolean }) {
  return (
    <div className={`flex items-start gap-3 ${flush ? "" : "mb-4"}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/25 ring-1 ring-primary-container/50 text-sm font-black text-primary-fixed-dim">
        {n}
      </span>
      <div>
        <h2 className="text-base sm:text-lg font-bold text-white leading-tight">{title}</h2>
        <p className="text-xs sm:text-sm text-slate-400">{hint}</p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[110px_1fr] gap-x-4 gap-y-2 items-center">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
        active ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/[0.06] text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ t }: { t: T }) {
  return (
    <div className="py-6 text-center">
      <div className="opacity-50 px-4">
        <BalanceMeter position={0} muted labels={{ cpu: t("meter.cpu"), balanced: t("meter.balanced"), gpu: t("meter.gpu") }} />
      </div>
      <h3 className="mt-6 text-lg font-bold text-white">{t("emptyTitle")}</h3>
      <p className="mt-1 text-sm text-slate-400 max-w-[300px] mx-auto">{t("emptyText")}</p>
      <ul className="mt-5 space-y-2 text-start">
        {(["what1", "what2", "what3"] as const).map((k) => (
          <li key={k} className="flex items-start gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2.5 text-xs text-slate-300">
            <Icon name="check_circle" className="text-[16px] text-emerald-400 shrink-0" />
            {t(`empty.${k}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal balance track: CPU-limited ← balanced → GPU-limited. One-shot slide of the marker. */
function BalanceMeter({
  position,
  muted,
  labels,
}: {
  position: number;
  muted?: boolean;
  labels: { cpu: string; balanced: string; gpu: string };
}) {
  // position −1…1 → 4%…96% along the track
  const pct = 50 + position * 46;
  return (
    <div>
      <div className="relative h-3 rounded-full overflow-hidden flex">
        <span className="h-full flex-[33] bg-orange-500/80" />
        <span className="h-full flex-[34] bg-emerald-500/80" />
        <span className="h-full flex-[33] bg-amber-400/80" />
      </div>
      <div className="relative h-0">
        <span
          className={`absolute -top-[22px] -translate-x-1/2 rtl:translate-x-1/2 flex flex-col items-center transition-[inset-inline-start] duration-700 ease-out ${muted ? "opacity-0" : ""}`}
          style={{ insetInlineStart: `${pct}%` }}
        >
          <span className="h-[30px] w-1.5 rounded-full bg-white shadow-[0_0_0_3px_rgba(15,23,42,1)]" />
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span className="text-start">{labels.cpu}</span>
        <span className="text-center">{labels.balanced}</span>
        <span className="text-end">{labels.gpu}</span>
      </div>
    </div>
  );
}

function ResultView({
  result,
  cpu,
  gpu,
  resolution,
  task,
  onResolution,
  t,
}: {
  result: BalanceResult;
  cpu: Cpu;
  gpu: Gpu;
  resolution: FpsResolution;
  task: Workload;
  onResolution: (r: FpsResolution) => void;
  t: T;
}) {
  const locale = useLocale() as Locale;
  const [showAllGames, setShowAllGames] = useState(false);
  const color = VERDICT_COLOR[result.verdict];
  const cpuLimited = result.games.filter((g) => g.limitedBy === "cpu").length;
  const side = result.verdict === "balanced" ? null : result.verdict;

  // Shop products for the weak side, matched to the built-in list on the client.
  const shop = useQuery(api.products.searchByType, side ? { specType: side, q: "", limit: 200 } : "skip");
  const upgrades = useMemo(() => {
    if (!side || !shop) return [];
    return pickUpgrades({
      cpuId: cpu.id,
      gpuId: gpu.id,
      resolution,
      task,
      side,
      products: shop.map((p) => ({ ...p, name: p.nameFr })),
    });
  }, [side, shop, cpu.id, gpu.id, resolution, task]);

  const shareText = t("shareText", {
    cpu: shortCpu(cpu.name),
    gpu: gpu.name,
    verdict: t(`verdictShort.${result.verdict}`, { percent: result.percent }),
  });
  const shareHref = `https://wa.me/?text=${encodeURIComponent(
    `${shareText}\n${typeof window !== "undefined" ? window.location.href.split("?")[0] : ""}`
  )}`;

  const games = showAllGames ? result.games : result.games.slice(0, 6);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="min-w-0 text-[11px] text-slate-400 truncate">
          {shortCpu(cpu.name)} · {gpu.name}
        </div>
        <span className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
          {resolution} · {t(`tasks.${task}`)}
        </span>
      </div>

      {/* Verdict */}
      <div className="text-center">
        {result.verdict !== "balanced" && (
          <div className="text-6xl font-black tabular-nums leading-none" style={{ color }}>
            {result.percent}%
          </div>
        )}
        {result.verdict === "balanced" && (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: `${color}22`, color }}>
            <Icon name="balance" className="text-[36px]" filled />
          </div>
        )}
        <div className="mt-2 text-xl font-black" style={{ color }}>
          {t(`verdictTitle.${result.verdict}`)}
        </div>
        <p className="mt-1.5 text-sm text-slate-300 leading-snug">
          {t(`verdictText.${result.verdict}`, { percent: result.percent, cpu: shortCpu(cpu.name), gpu: gpu.name })}
        </p>
      </div>

      <div className="mt-8 px-1">
        <BalanceMeter
          key={`${cpu.id}-${gpu.id}`}
          position={result.position}
          labels={{ cpu: t("meter.cpu"), balanced: t("meter.balanced"), gpu: t("meter.gpu") }}
        />
      </div>

      {/* Per resolution */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {RESOLUTIONS.map((r) => {
          const v = result.byResolution[r];
          return (
            <button
              key={r}
              type="button"
              onClick={() => onResolution(r)}
              className={`rounded-xl px-2 py-2 text-center ring-1 transition-colors ${
                r === resolution ? "bg-white/10 ring-white/25" : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.07]"
              }`}
            >
              <div className="text-[10px] font-bold text-slate-500">{r}</div>
              <div className="text-[11px] font-black whitespace-nowrap" style={{ color: VERDICT_COLOR[v.verdict] }}>
                {t(`verdictShort.${v.verdict}`, { percent: v.percent })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Per game */}
      <div className="mt-5 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-3.5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("gamesTitle")}</div>
        <p className="mt-1 text-xs text-slate-300">
          {t("gamesSummary", { count: cpuLimited, total: result.games.length })}
        </p>
        <ul className="mt-2.5 space-y-1">
          {games.map((g) => (
            <li key={g.id} className="flex items-center gap-2 text-xs">
              <span className="flex-1 truncate text-slate-300">{g.name}</span>
              <span className="tabular-nums font-black text-white w-10 text-end">{g.fps}</span>
              <span
                className={`w-[78px] shrink-0 rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold ${
                  g.limitedBy === "cpu"
                    ? "bg-orange-500/15 text-orange-300"
                    : g.limitedBy === "gpu"
                    ? "bg-sky-500/15 text-sky-300"
                    : "bg-white/10 text-slate-300"
                }`}
              >
                {t(`limiter.${g.limitedBy}`)}
              </span>
            </li>
          ))}
        </ul>
        {result.games.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAllGames((v) => !v)}
            className="mt-2 text-xs font-bold text-primary-fixed-dim hover:text-white"
          >
            {showAllGames ? t("showLess") : t("showAll", { total: result.games.length })}
          </button>
        )}
        <p className="mt-2 text-[10px] text-slate-500">{t("gamesNote")}</p>
      </div>

      {/* Power supply + RAM */}
      <div className="mt-3 grid gap-2">
        <div
          className={`flex items-start gap-2.5 rounded-xl p-3 ring-1 ${
            result.psu.status === "low" ? "bg-red-500/10 ring-red-500/30" : "bg-white/[0.04] ring-white/10"
          }`}
        >
          <Icon
            name="power"
            className={`text-[18px] shrink-0 mt-0.5 ${result.psu.status === "low" ? "text-red-400" : result.psu.status === "ok" ? "text-emerald-400" : "text-slate-400"}`}
          />
          <p className="text-sm text-slate-200 leading-snug">
            {t(`psu.${result.psu.status}`, { recommended: result.psu.recommended, current: result.psu.current ?? 0 })}
            {result.psu.status === "low" && (
              <>
                {" "}
                <Link href="/shop/power-supplies" className="font-bold text-red-300 underline underline-offset-2">
                  {t("psu.shop")}
                </Link>
              </>
            )}
          </p>
        </div>
        {result.warnings.map((w) => (
          <div key={w} className="flex items-start gap-2.5 rounded-xl bg-amber-400/10 ring-1 ring-amber-400/20 p-3">
            <Icon name="memory_alt" className="text-amber-300 text-[18px] shrink-0 mt-0.5" />
            <p className="text-sm text-amber-50/90 leading-snug">{t(`warn.${w}`)}</p>
          </div>
        ))}
      </div>

      {/* Upgrades from the shop */}
      {side && (
        <div className="mt-5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            {t(side === "cpu" ? "upgrades.cpuHeading" : "upgrades.gpuHeading")}
          </div>
          {upgrades.length > 0 ? (
            <div className="space-y-2">
              {upgrades.map((u) => (
                <Link
                  key={u.product._id}
                  href={`/product/${u.product.slug}`}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.05] ring-1 ring-white/10 p-2.5 hover:ring-primary-container/60 hover:bg-white/[0.08] transition-all"
                >
                  {u.product.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.product.images[0]} alt="" className="h-12 w-12 rounded-lg bg-white object-contain p-1 shrink-0" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-white truncate">{localizedName(u.product, locale)}</span>
                    {!u.sameSocket && <span className="block text-[11px] text-amber-300">{t("upgrades.newBoard")}</span>}
                  </span>
                  <span className="text-sm font-black text-primary-fixed-dim shrink-0">{formatDzd(u.product.priceDzd, locale)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <Link
              href={side === "cpu" ? "/shop/processors" : "/shop/graphics-cards"}
              className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.05] ring-1 ring-white/10 px-3.5 py-3 text-sm font-bold text-white hover:bg-white/[0.08]"
            >
              {t(side === "cpu" ? "upgrades.browseCpu" : "upgrades.browseGpu")}
              <Icon name="arrow_forward" flip className="text-[18px]" />
            </Link>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link
          href="/fps-estimator"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-3 text-sm font-black text-primary hover:bg-primary-fixed transition-colors"
        >
          <Icon name="speed" className="text-[18px]" />
          {t("ctaFps")}
        </Link>
        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/15 ring-1 ring-[#25D366]/40 px-3 py-3 text-sm font-bold text-[#4ee68a] hover:bg-[#25D366]/25 transition-colors"
        >
          <Icon name="share" className="text-[18px]" />
          {t("share")}
        </a>
      </div>

      <p className="mt-4 text-center text-[10px] text-slate-500">{t("disclaimer")}</p>
    </div>
  );
}
