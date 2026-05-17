"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { Icon } from "@/components/ui/Icon";

export function ToolCrossPromo({ target }: { target: "fps" | "bottleneck" }) {
  const t = useTranslations(target === "fps" ? "bottleneck.crossPromo" : "fpsEstimator.crossPromo");
  const href = target === "fps" ? "/fps-estimator" : "/bottleneck-calculator";
  const icon = target === "fps" ? "speed" : "balance";

  return (
    <Link
      href={href}
      className="block max-w-3xl mx-auto rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 hover:ring-primary/50 hover:bg-white/10 transition-all p-5 sm:p-6 mt-8"
    >
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-primary/20 p-3 shrink-0">
          <Icon name={icon} className="text-primary-200 text-[24px]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-primary-200 mb-1">
            {t("badge")}
          </div>
          <div className="text-base font-bold text-white">{t("title")}</div>
          <div className="text-sm text-slate-400">{t("subtitle")}</div>
        </div>
        <Icon name="arrow_forward" className="text-slate-400 text-[20px] shrink-0" />
      </div>
    </Link>
  );
}
