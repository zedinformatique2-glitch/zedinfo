"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { useTranslations } from "next-intl";
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

interface Props {
  cpuName: string | undefined;
  gpuName: string | undefined;
  ramInfo: string | undefined;
}

export function FpsEstimator({ cpuName, gpuName, ramInfo }: Props) {
  const t = useTranslations("configurator.fps");
  const estimate = useAction(api.fpsEstimate.estimateFps);

  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [customGame, setCustomGame] = useState("");
  const [resolution, setResolution] = useState<string>("1080p");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    fps: number; quality: string; confidence: string; tip: string;
  } | null>(null);

  const hasBoth = !!cpuName && !!gpuName;

  async function run(game: string) {
    if (!cpuName || !gpuName || !game) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await estimate({ cpuName, gpuName, ramInfo, game, resolution });
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
    const gameName = selectedGame === "custom"
      ? customGame
      : GAMES.find((g) => g.id === selectedGame)?.name;
    if (gameName) {
      setResult(null);
      setLoading(true);
      estimate({ cpuName: cpuName!, gpuName: gpuName!, ramInfo, game: gameName, resolution: res })
        .then(setResult)
        .catch(() => setResult({ fps: 0, quality: "?", confidence: "low", tip: "Erreur." }))
        .finally(() => setLoading(false));
    }
  }

  const fpsPercent = result ? Math.min((result.fps / 144) * 100, 100) : 0;

  return (
    <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon name="speed" className="text-primary text-[22px]" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{t("title")}</h3>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
      </div>

      {!hasBoth ? (
        <div className="rounded-xl bg-slate-50 p-6 text-center text-slate-400 text-sm">
          <Icon name="memory" className="text-[32px] mb-2" />
          <p>{t("needCpuGpu")}</p>
        </div>
      ) : (
        <>
          {/* Resolution picker */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-slate-600">{t("selectResolution")}:</span>
            <div className="flex gap-1.5">
              {RESOLUTIONS.map((res) => (
                <button
                  key={res}
                  onClick={() => onResolutionChange(res)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    resolution === res
                      ? "bg-primary text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Game grid */}
          <p className="text-sm font-medium text-slate-600 mb-3">{t("selectGame")}:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => onGameClick(game)}
                disabled={loading}
                className={`group relative overflow-hidden rounded-xl transition-all ${
                  selectedGame === game.id
                    ? "ring-2 ring-primary shadow-md"
                    : "ring-1 ring-slate-200 hover:ring-primary/40 hover:shadow-sm"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <span className="absolute bottom-1.5 inset-x-0 text-center text-xs font-bold text-white drop-shadow-lg px-1 truncate">
                    {game.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Custom game input */}
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={customGame}
              onChange={(e) => setCustomGame(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onCustomSubmit()}
              placeholder={t("customGame")}
              className="flex-1 rounded-xl bg-slate-50 ring-1 ring-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={onCustomSubmit}
              disabled={loading || !customGame.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {t("estimate")}
            </button>
          </div>

          {/* Result */}
          {loading && (
            <div className="rounded-xl bg-slate-50 p-6 text-center">
              <div className="animate-spin inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full mb-3" />
              <p className="text-sm text-slate-500">{t("estimating")}</p>
            </div>
          )}

          {result && !loading && (
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-5 space-y-4">
              {/* FPS display */}
              <div className="text-center">
                <div className={`text-5xl font-black ${fpsColor(result.fps)}`}>
                  {result.fps}
                </div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  {t("fpsLabel")}
                </div>
              </div>

              {/* FPS bar */}
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${fpsBarColor(result.fps)}`}
                  style={{ width: `${fpsPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 -mt-2">
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
                <div className="flex items-start gap-2 bg-white rounded-xl p-3">
                  <Icon name="lightbulb" className="text-amber-500 text-[18px] shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">{result.tip}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
