"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { Link } from "@/lib/i18n/routing";
import { ToolCrossPromo } from "@/components/bottleneck/ToolCrossPromo";
import { CPUS, GPUS, FPS_GAMES, type Cpu, type Gpu, type FpsGame, type FpsResolution, type Preset } from "@/lib/fps-data";
import { estimateFps, findCpu, findGpu, type FpsEstimate } from "@/lib/fps-engine";
import { HardwareInput } from "./HardwareInput";
import { FpsGauge, fpsTier } from "./FpsGauge";

const RESOLUTIONS: FpsResolution[] = ["1080p", "1440p", "4K"];
const RAM_OPTIONS = [8, 16, 32, 64] as const;
const PRESET_ORDER: Preset[] = ["low", "medium", "high", "ultra"];

const FEATURED_GAMES = FPS_GAMES.filter((g) => g.img);
const MORE_GAMES = FPS_GAMES.filter((g) => !g.img);

const BUILDS = [
  { cpu: "i3-12100f", gpu: "gtx-1650" },
  { cpu: "i5-12400f", gpu: "rtx-3060" },
  { cpu: "r5-5600", gpu: "rx-6600" },
  { cpu: "r7-7800x3d", gpu: "rtx-4070-super" },
];

const shortCpu = (name: string) => name.replace(/^(Intel Core|AMD) /, "");

export function FpsEstimatorStandalone() {
  const t = useTranslations("fpsEstimator");

  const [cpu, setCpu] = useState<Cpu | null>(null);
  const [gpu, setGpu] = useState<Gpu | null>(null);
  const [ram, setRam] = useState<number>(16);
  const [resolution, setResolution] = useState<FpsResolution>("1080p");
  const [game, setGame] = useState<FpsGame | null>(null);
  const [nudge, setNudge] = useState(false);

  const hasHardware = !!cpu && !!gpu;

  const result = useMemo(
    () =>
      cpu && gpu && game
        ? estimateFps({ cpuId: cpu.id, gpuId: gpu.id, gameId: game.id, resolution, ramGb: ram })
        : null,
    [cpu, gpu, game, resolution, ram]
  );

  function scrollTo(id: string, block: ScrollLogicalPosition = "start") {
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block }));
  }

  function chooseGame(g: FpsGame) {
    setGame(g);
    if (!hasHardware) {
      setNudge(true);
      scrollTo("fps-step-1", "center");
      return;
    }
    if (window.innerWidth < 1024) scrollTo("fps-result");
  }

  function applyBuild(b: (typeof BUILDS)[number]) {
    setCpu(findCpu(b.cpu) ?? null);
    setGpu(findGpu(b.gpu) ?? null);
    setNudge(false);
  }

  function shareUrl(r: FpsEstimate) {
    const text = t("shareText", {
      fps: r.fps,
      game: game!.name,
      resolution,
      cpu: shortCpu(cpu!.name),
      gpu: gpu!.name,
    });
    const url = typeof window !== "undefined" ? window.location.href.split("?")[0] : "";
    return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  }

  const stepDone = [hasHardware, !!game, !!result];
  const buildActive = (b: (typeof BUILDS)[number]) => cpu?.id === b.cpu && gpu?.id === b.gpu;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Backdrop glow (static) */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] max-w-[160vw] rounded-full bg-primary/30 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />

      {/* Hero */}
      <section className="relative pt-16 sm:pt-20 pb-8 sm:pb-10 text-center px-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-4 py-1.5 text-xs font-bold text-primary-fixed-dim mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t("badge")}
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4">
          {t("titleLead")}{" "}
          <span className="bg-gradient-to-r from-primary-fixed-dim via-sky-300 to-violet-300 bg-clip-text text-transparent">
            {t("titleAccent")}
          </span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">{t("subtitle")}</p>

        <ol className="mt-8 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
          {(["stepPc", "stepGame", "stepResult"] as const).map((k, i) => (
            <li key={k} className="flex items-center gap-2 sm:gap-3">
              <span
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-semibold ring-1 transition-colors ${
                  stepDone[i] ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" : "bg-white/5 text-slate-400 ring-white/10"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${
                    stepDone[i] ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-300"
                  }`}
                >
                  {stepDone[i] ? <Icon name="check" className="text-[14px]" /> : i + 1}
                </span>
                {t(k)}
              </span>
              {i < 2 && <span className="hidden sm:block h-px w-6 bg-white/15" />}
            </li>
          ))}
        </ol>
      </section>

      <div className="relative max-w-6xl mx-auto px-4 pb-16 grid lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
        {/* ───────── Left: configuration ───────── */}
        <div className="space-y-6 min-w-0">
          {/* Step 1 — hardware */}
          <section
            id="fps-step-1"
            className={`rounded-3xl bg-white/[0.04] ring-1 p-5 sm:p-6 transition-colors ${
              nudge && !hasHardware ? "ring-red-500/50" : "ring-white/10"
            }`}
          >
            <StepHeading n={1} title={t("step1Title")} hint={t("step1Hint")} />

            <div className="grid sm:grid-cols-2 gap-3">
              <HardwareInput
                items={CPUS}
                icon="memory"
                label={t("cpuLabel")}
                placeholder={t("cpuPlaceholder")}
                selected={cpu}
                onSelect={setCpu}
                invalid={nudge}
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
                invalid={nudge}
                noMatch={t("noMatch")}
                popularLabel={t("popularLabel")}
              />
            </div>

            {nudge && !hasHardware && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-red-400">
                <Icon name="error" className="text-[18px]" />
                {t("needCpuGpu")}
              </p>
            )}

            <div className="mt-4 grid sm:grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("ramLabel")}</span>
              <div className="flex flex-wrap gap-1.5">
                {RAM_OPTIONS.map((r) => (
                  <Chip key={r} active={ram === r} onClick={() => setRam(r)}>
                    {t("ramValue", { gb: r })}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("presetsLabel")}</div>
              <div className="flex flex-wrap gap-2">
                {BUILDS.map((b) => (
                  <button
                    key={b.gpu}
                    type="button"
                    onClick={() => applyBuild(b)}
                    aria-pressed={buildActive(b)}
                    className={`rounded-xl px-3 py-2 text-start ring-1 transition-all ${
                      buildActive(b)
                        ? "bg-primary/30 ring-primary-fixed-dim"
                        : "bg-white/[0.04] ring-white/10 hover:ring-primary-container/60 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{findGpu(b.gpu)?.name}</div>
                    <div className="text-[11px] text-slate-400">{shortCpu(findCpu(b.cpu)?.name ?? "")}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Step 2 — game & resolution */}
          <section className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <StepHeading n={2} title={t("step2Title")} hint={t("step2Hint")} flush />
              <div className="inline-flex rounded-xl bg-black/30 ring-1 ring-white/10 p-1">
                {RESOLUTIONS.map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res)}
                    aria-pressed={resolution === res}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      resolution === res ? "bg-primary text-white shadow-lg shadow-primary/40" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FEATURED_GAMES.map((g) => {
                const active = game?.id === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => chooseGame(g)}
                    aria-pressed={active}
                    className={`group relative overflow-hidden rounded-2xl text-start transition-all duration-200 ${
                      active ? "ring-2 ring-primary-fixed-dim shadow-xl shadow-primary/30" : "ring-1 ring-white/10 hover:ring-white/30 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="relative aspect-[460/215]">
                      <Image
                        src={g.img!}
                        alt={g.name}
                        fill
                        className={`object-cover transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`}
                        sizes="(max-width: 640px) 50vw, 200px"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${active ? "from-primary/90 via-primary/30" : "from-black/85 via-black/30"} to-transparent`} />
                      <span className="absolute bottom-2 start-2.5 end-2.5 text-xs font-bold text-white drop-shadow truncate">{g.name}</span>
                      {active && (
                        <span className="absolute top-2 end-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary shadow">
                          <Icon name="check" className="text-[16px]" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("moreGames")}</div>
              <div className="flex flex-wrap gap-2">
                {MORE_GAMES.map((g) => (
                  <Chip key={g.id} active={game?.id === g.id} onClick={() => chooseGame(g)}>
                    {g.name}
                  </Chip>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ───────── Right: result panel ───────── */}
        <aside id="fps-result" className="lg:sticky lg:top-24 scroll-mt-24">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 ring-1 ring-white/10 shadow-2xl">
            {result && game?.img && (
              <>
                <Image src={game.img} alt="" fill className="object-cover opacity-20" sizes="400px" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/90 to-slate-900" />
              </>
            )}
            <div className="relative p-6">
              {result && game && cpu && gpu ? (
                <ResultView
                  key={`${game.id}-${cpu.id}-${gpu.id}`}
                  result={result}
                  game={game}
                  cpu={cpu}
                  gpu={gpu}
                  resolution={resolution}
                  onResolution={setResolution}
                  t={t}
                  shareHref={shareUrl(result)}
                />
              ) : (
                <EmptyState t={t} />
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="relative px-4 pb-16">
        <ToolCrossPromo target="bottleneck" />
      </div>
    </div>
  );
}

/* ───────────────────────── pieces ───────────────────────── */

type T = ReturnType<typeof useTranslations<"fpsEstimator">>;

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

const TIER_KEYS = ["unplayable", "playable", "smooth", "competitive"] as const;
const TIER_COLORS = { unplayable: "#ef4444", playable: "#f59e0b", smooth: "#22c55e", competitive: "#a78bfa" };

function EmptyState({ t }: { t: T }) {
  return (
    <div className="py-6 text-center">
      <svg viewBox="0 0 220 120" className="w-full max-w-[240px] mx-auto opacity-40">
        <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="14" strokeLinecap="round" strokeDasharray="2 6" />
        <text x="110" y="100" textAnchor="middle" fontSize="40" fontWeight="900" fill="rgba(255,255,255,0.5)">--</text>
      </svg>
      <h3 className="mt-4 text-lg font-bold text-white">{t("emptyTitle")}</h3>
      <p className="mt-1 text-sm text-slate-400 max-w-[280px] mx-auto">{t("emptyText")}</p>
      <ul className="mt-5 grid grid-cols-2 gap-2 text-start">
        {TIER_KEYS.map((k) => (
          <li key={k} className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: TIER_COLORS[k] }} />
            <span className="text-[11px] leading-tight">
              <span className="block font-bold text-white">{t(`tiers.${k}`)}</span>
              <span className="text-slate-500">{t(`tierRanges.${k}`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultView({
  result,
  game,
  cpu,
  gpu,
  resolution,
  onResolution,
  t,
  shareHref,
}: {
  result: FpsEstimate;
  game: FpsGame;
  cpu: Cpu;
  gpu: Gpu;
  resolution: FpsResolution;
  onResolution: (r: FpsResolution) => void;
  t: T;
  shareHref: string;
}) {
  const tier = fpsTier(result.fps);
  const upgradeHint = result.fps < 60 && result.limitedBy !== "engine";
  const maxPresetFps = Math.max(...PRESET_ORDER.map((p) => result.byPreset[p]), 1);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="text-base font-black text-white truncate">{game.name}</div>
          <div className="text-[11px] text-slate-400 truncate">
            {shortCpu(cpu.name)} · {gpu.name}
          </div>
        </div>
        <span className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
          {resolution} · {t(`qualities.${result.preset}`)}
        </span>
      </div>

      <FpsGauge fps={result.fps} label={t("fpsLabel")} />

      <div className="mt-5 flex justify-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-black"
          style={{ color: tier.color, background: `${tier.color}1a`, boxShadow: `inset 0 0 0 1px ${tier.color}55` }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: tier.color }} />
          {t(`tiers.${tier.key}`)}
        </span>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">{t(`tierDesc.${tier.key}`)}</p>

      {/* FPS per preset */}
      <div className="mt-5 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("byPresetTitle")}</span>
          <span className="text-[10px] font-semibold text-slate-500">
            {t("limitedByLabel")}: <span className="text-slate-300">{t(`limitedBy.${result.limitedBy}`)}</span>
          </span>
        </div>
        <ul className="space-y-1.5">
          {PRESET_ORDER.map((p) => {
            const v = result.byPreset[p];
            const rec = p === result.preset;
            return (
              <li key={p} className="flex items-center gap-2.5 text-xs">
                <span className={`w-14 shrink-0 font-semibold ${rec ? "text-white" : "text-slate-400"}`}>{t(`qualities.${p}`)}</span>
                <span className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <span
                    className="block h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${(v / maxPresetFps) * 100}%`, background: fpsTier(v).color, opacity: rec ? 1 : 0.55 }}
                  />
                </span>
                <span className={`w-9 text-end tabular-nums font-black ${rec ? "text-white" : "text-slate-400"}`}>{v}</span>
                {rec ? (
                  <Icon name="star" filled className="text-[14px] text-amber-300" />
                ) : (
                  <span className="w-[14px]" />
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* FPS per resolution */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        {RESOLUTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onResolution(r)}
            className={`rounded-xl px-2 py-2 text-center ring-1 transition-colors ${
              r === resolution ? "bg-white/10 ring-white/25" : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.07]"
            }`}
          >
            <div className="text-[10px] font-bold text-slate-500">{r}</div>
            <div className="text-sm font-black tabular-nums" style={{ color: fpsTier(result.byResolution[r]).color }}>
              {result.byResolution[r]}
            </div>
          </button>
        ))}
      </div>

      {/* Tips */}
      <ul className="mt-3 space-y-2">
        {result.tips.slice(0, 3).map((tip) => (
          <li key={tip.key} className="flex items-start gap-2.5 rounded-xl bg-amber-400/10 ring-1 ring-amber-400/20 p-3">
            <Icon name="lightbulb" className="text-amber-300 text-[18px] shrink-0 mt-0.5" />
            <p className="text-sm text-amber-50/90 leading-snug">{t(`tips.${tip.key}`, tip.values ?? {})}</p>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-2">
        <Link
          href={upgradeHint ? "/shop/graphics-cards" : "/configurator"}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-primary hover:bg-primary-fixed transition-colors"
        >
          <Icon name={upgradeHint ? "upgrade" : "build"} className="text-[18px]" />
          {upgradeHint ? t("ctaUpgrade") : t("ctaBuild")}
        </Link>
        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/15 ring-1 ring-[#25D366]/40 px-4 py-2.5 text-sm font-bold text-[#4ee68a] hover:bg-[#25D366]/25 transition-colors"
        >
          <Icon name="share" className="text-[18px]" />
          {t("share")}
        </a>
      </div>

      <p className="mt-4 text-center text-[10px] text-slate-500">{t("disclaimer")}</p>
    </div>
  );
}
