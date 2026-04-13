"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/ui/Icon";

const GAMES = [
  { id: "cs2", name: "Counter-Strike 2", img: "/games/cs2.jpg" },
  { id: "valorant", name: "Valorant", img: "/games/valorant.jpg" },
  { id: "gtav", name: "GTA V", img: "/games/gtav.jpg" },
  { id: "cyberpunk", name: "Cyberpunk 2077", img: "/games/cyberpunk.jpg" },
  { id: "fortnite", name: "Fortnite", img: "/games/fortnite.jpg" },
  { id: "eldenring", name: "Elden Ring", img: "/games/eldenring.jpg" },
  { id: "warzone", name: "COD Warzone", img: "/games/warzone.jpg" },
  { id: "minecraft", name: "Minecraft", img: "/games/minecraft.jpg" },
];

const RESOLUTIONS = ["1080p", "1440p", "4K"] as const;

function fpsColor(fps: number) {
  if (fps < 30) return "text-red-500";
  if (fps < 60) return "text-amber-500";
  return "text-green-500";
}

function fpsBarColor(fps: number) {
  if (fps < 30) return "bg-red-500";
  if (fps < 60) return "bg-amber-500";
  return "bg-green-500";
}

function qualityColor(q: string) {
  switch (q.toLowerCase()) {
    case "ultra": return "bg-purple-100 text-purple-700";
    case "high": return "bg-green-100 text-green-700";
    case "medium": return "bg-amber-100 text-amber-700";
    default: return "bg-red-100 text-red-700";
  }
}

export function FpsEstimatorStandalone() {
  const t = useTranslations("fpsEstimator");
  const locale = useLocale();
  const estimate = useAction(api.fpsEstimate.estimateFps);

  const [cpuName, setCpuName] = useState("");
  const [gpuName, setGpuName] = useState("");
  const [ramInfo, setRamInfo] = useState("");
  const [resolution, setResolution] = useState<string>("1080p");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [customGame, setCustomGame] = useState("");
  const [loading, setLoading] = useState(false);
  const [shakeInputs, setShakeInputs] = useState(false);
  const [result, setResult] = useState<{
    fps: number; quality: string; confidence: string; tip: string;
  } | null>(null);

  const hasBoth = cpuName.trim().length > 0 && gpuName.trim().length > 0;

  function triggerShake() {
    setShakeInputs(true);
    setTimeout(() => setShakeInputs(false), 600);
  }

  async function run(game: string) {
    if (!hasBoth) {
      triggerShake();
      return;
    }
    if (!game) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await estimate({
        cpuName: cpuName.trim(),
        gpuName: gpuName.trim(),
        ramInfo: ramInfo.trim() || undefined,
        game,
        resolution,
        locale,
      });
      setResult(r);
    } catch {
      setResult({ fps: 0, quality: "?", confidence: "low", tip: "Erreur lors de l'estimation." });
    } finally {
      setLoading(false);
    }
  }

  function onGameClick(game: typeof GAMES[number]) {
    setSelectedGame(game.id);
    setCustomGame("");
    run(game.name);
  }

  function onCustomSubmit() {
    if (!customGame.trim()) return;
    setSelectedGame("custom");
    run(customGame.trim());
  }

  function onResolutionChange(res: string) {
    setResolution(res);
    if (!hasBoth) return;
    const gameName = selectedGame === "custom"
      ? customGame
      : GAMES.find((g) => g.id === selectedGame)?.name;
    if (gameName) {
      setResult(null);
      setLoading(true);
      estimate({
        cpuName: cpuName.trim(),
        gpuName: gpuName.trim(),
        ramInfo: ramInfo.trim() || undefined,
        game: gameName,
        resolution: res,
        locale,
      })
        .then(setResult)
        .catch(() => setResult({ fps: 0, quality: "?", confidence: "low", tip: "Erreur." }))
        .finally(() => setLoading(false));
    }
  }

  const fpsPercent = result ? Math.min((result.fps / 144) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
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

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        {/* Hardware inputs */}
        <div className={`rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 p-5 sm:p-6 mb-6 transition-all ${shakeInputs ? "animate-shake ring-red-500/60" : ""}`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                {t("cpuLabel")} *
              </label>
              <input
                type="text"
                value={cpuName}
                onChange={(e) => setCpuName(e.target.value)}
                placeholder={t("cpuPlaceholder")}
                className="w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                {t("gpuLabel")} *
              </label>
              <input
                type="text"
                value={gpuName}
                onChange={(e) => setGpuName(e.target.value)}
                placeholder={t("gpuPlaceholder")}
                className="w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                {t("ramLabel")}
              </label>
              <input
                type="text"
                value={ramInfo}
                onChange={(e) => setRamInfo(e.target.value)}
                placeholder={t("ramPlaceholder")}
                className="w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {!hasBoth && shakeInputs && (
            <p className="text-red-400 text-sm mt-3 text-center">{t("needCpuGpu")}</p>
          )}
        </div>

        {/* Resolution picker */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-sm font-medium text-slate-400">{t("resolution")}:</span>
          <div className="flex gap-1.5">
            {RESOLUTIONS.map((res) => (
              <button
                key={res}
                onClick={() => onResolutionChange(res)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  resolution === res
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        {/* Game grid */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
          {t("selectGame")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => onGameClick(game)}
              disabled={loading}
              className={`group relative overflow-hidden rounded-2xl transition-all ${
                selectedGame === game.id
                  ? "ring-2 ring-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : "ring-1 ring-white/10 hover:ring-primary/40 hover:shadow-md hover:scale-[1.01]"
              } disabled:opacity-50`}
            >
              <div className="relative aspect-[460/215]">
                <Image
                  src={game.img}
                  alt={game.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <span className="absolute bottom-2 inset-x-0 text-center text-xs font-bold text-white drop-shadow-lg px-1 truncate">
                  {game.name}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom game input */}
        <div className="flex gap-2 mb-8 max-w-lg mx-auto">
          <input
            type="text"
            value={customGame}
            onChange={(e) => setCustomGame(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCustomSubmit()}
            placeholder={t("customGame")}
            className="flex-1 rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={onCustomSubmit}
            disabled={loading || !customGame.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
          >
            {t("estimate")}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 p-8 text-center">
            <div className="animate-spin inline-block w-10 h-10 border-3 border-primary border-t-transparent rounded-full mb-3" />
            <p className="text-sm text-slate-400">{t("estimating")}</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 p-6 sm:p-8 space-y-5">
            {/* FPS display */}
            <div className="text-center">
              <div className={`text-6xl sm:text-7xl font-black ${fpsColor(result.fps)}`}>
                {result.fps}
              </div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1">
                {t("fpsLabel")}
              </div>
            </div>

            {/* FPS bar */}
            <div className="w-full bg-white/10 rounded-full h-3.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${fpsBarColor(result.fps)}`}
                style={{ width: `${fpsPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 -mt-3">
              <span>0</span><span>30</span><span>60</span><span>144+</span>
            </div>

            {/* Quality & confidence */}
            <div className="flex items-center justify-center gap-3">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${qualityColor(result.quality)}`}>
                {result.quality}
              </span>
              <span className="text-xs text-slate-400">
                {t("confidence")}: {result.confidence}
              </span>
            </div>

            {/* Tip */}
            {result.tip && (
              <div className="flex items-start gap-2 bg-white/5 rounded-xl p-4">
                <Icon name="lightbulb" className="text-amber-500 text-[18px] shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300">{result.tip}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
