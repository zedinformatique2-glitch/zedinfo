// Pure TS compatibility engine for PC configurator.
// Works on both client and server.

export type ComponentSpec = {
  type: string;
  [key: string]: any;
};

export type ConfigComponent = {
  _id?: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  priceDzd: number;
  specs: ComponentSpec;
};

export type ConfigSelection = {
  cpu?: ConfigComponent;
  motherboard?: ConfigComponent;
  ram?: ConfigComponent[];
  gpu?: ConfigComponent;
  psu?: ConfigComponent;
  case?: ConfigComponent;
  cooler?: ConfigComponent;
  storage?: ConfigComponent[];
};

export type CompatibilityResult = {
  compatible: boolean;
  errors: string[];
  warnings: string[];
  estimatedWattage: number;
  recommendedPsu: number;
  totalPrice: number;
};

// ── Normalization helpers ───────────────────────────────────────────────────
// Product specs come from multiple sources (seed scripts, admin JSON edits,
// scraped data) and casing/shape is inconsistent. Normalize before comparing.

function norm(s: unknown): string {
  return typeof s === "string" ? s.trim().toUpperCase() : "";
}

/** Coerce a socket field that might be: array, space-separated string, or missing. */
function toSocketList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(norm).filter(Boolean);
  if (typeof v === "string") return v.split(/[\s,;/]+/).map(norm).filter(Boolean);
  return [];
}

function toFormFactorList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(norm).filter(Boolean);
  if (typeof v === "string") return v.split(/[\s,;/]+/).map(norm).filter(Boolean);
  return [];
}

/** True if both sockets present and don't match. Missing data → not a mismatch. */
function socketMismatch(a: unknown, b: unknown): boolean {
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return false;
  return A !== B;
}

/** True if the cooler/list has socket data AND it doesn't include the cpu socket. */
function listExcludes(list: string[], target: unknown): boolean {
  const T = norm(target);
  if (!T || list.length === 0) return false;
  return !list.includes(T);
}

export function checkCompatibility(sel: ConfigSelection): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { cpu, motherboard, ram = [], gpu, psu, case: pcCase, cooler, storage = [] } = sel;

  // Socket match (CPU ↔ motherboard)
  if (cpu && motherboard && socketMismatch(cpu.specs.socket, motherboard.specs.socket)) {
    errors.push(
      `Socket incompatible: CPU (${cpu.specs.socket}) ≠ carte mère (${motherboard.specs.socket})`
    );
  }

  // RAM type
  if (ram.length && motherboard) {
    const mbType = norm(motherboard.specs.ramType);
    const bad = ram.find((r) => {
      const rt = norm(r.specs.ramType);
      return rt && mbType && rt !== mbType;
    });
    if (bad) {
      errors.push(
        `Type de RAM incompatible: ${bad.specs.ramType} ≠ ${motherboard.specs.ramType}`
      );
    }
  }

  // RAM slots
  if (ram.length && motherboard && typeof motherboard.specs.ramSlots === "number") {
    const totalSticks = ram.reduce((s, r) => s + (r.specs.sticks ?? 1), 0);
    if (totalSticks > motherboard.specs.ramSlots) {
      errors.push(
        `Trop de barrettes RAM: ${totalSticks} > ${motherboard.specs.ramSlots} slots`
      );
    }
  }

  // RAM capacity
  if (ram.length && motherboard && typeof motherboard.specs.maxRam === "number") {
    const totalGb = ram.reduce((s, r) => s + (r.specs.sizeGb ?? 0), 0);
    if (totalGb > motherboard.specs.maxRam) {
      errors.push(`Capacité RAM trop élevée: ${totalGb}GB > ${motherboard.specs.maxRam}GB`);
    }
  }

  // Form factor (case ↔ motherboard)
  if (motherboard && pcCase) {
    const supported = toFormFactorList(pcCase.specs.supportedFormFactors);
    const mbFF = norm(motherboard.specs.formFactor);
    if (supported.length && mbFF && !supported.includes(mbFF)) {
      errors.push(
        `Format incompatible: ${motherboard.specs.formFactor} non supporté par le boîtier`
      );
    }
  }

  // GPU length (case)
  if (gpu && pcCase && typeof gpu.specs.lengthMm === "number" && typeof pcCase.specs.maxGpuLengthMm === "number") {
    if (gpu.specs.lengthMm > pcCase.specs.maxGpuLengthMm) {
      errors.push(
        `GPU trop long: ${gpu.specs.lengthMm}mm > ${pcCase.specs.maxGpuLengthMm}mm`
      );
    }
  }

  // Cooler height (case)
  if (cooler && pcCase && typeof cooler.specs.heightMm === "number" && typeof pcCase.specs.maxCoolerHeightMm === "number") {
    if (cooler.specs.heightMm > pcCase.specs.maxCoolerHeightMm) {
      warnings.push(
        `Hauteur du ventirad: ${cooler.specs.heightMm}mm > ${pcCase.specs.maxCoolerHeightMm}mm`
      );
    }
  }

  // Cooler socket — only error if cooler has socket data AND it excludes the cpu socket.
  // If the cooler has no socket data at all, assume universal modern mounting (warn instead of block).
  if (cooler && cpu) {
    const sockets = toSocketList(cooler.specs.socket);
    if (sockets.length === 0) {
      warnings.push(`Compatibilité du ventirad non spécifiée — vérifiez avant achat`);
    } else if (listExcludes(sockets, cpu.specs.socket)) {
      errors.push(`Ventirad non compatible avec le socket ${cpu.specs.socket}`);
    }
  }

  // Cooler TDP
  if (cooler && cpu && typeof cpu.specs.tdp === "number" && typeof cooler.specs.tdpSupport === "number") {
    if (cpu.specs.tdp > cooler.specs.tdpSupport) {
      warnings.push(
        `Ventirad sous-dimensionné: TDP CPU ${cpu.specs.tdp}W > ${cooler.specs.tdpSupport}W`
      );
    }
  }

  // Wattage estimate
  const cpuW = cpu?.specs.tdp ?? 0;
  const gpuW = gpu?.specs.tdp ?? 0;
  const baseW = 100; // mobo, storage, fans, RAM
  const estimatedWattage = cpuW + gpuW + baseW;
  const recommendedPsu = Math.ceil((estimatedWattage * 1.3) / 50) * 50;

  // PSU wattage
  if (psu && typeof psu.specs.wattage === "number") {
    if (psu.specs.wattage < recommendedPsu) {
      errors.push(
        `Alimentation insuffisante: ${psu.specs.wattage}W < ${recommendedPsu}W recommandés`
      );
    }
  }

  // Total price
  const totalPrice =
    (cpu?.priceDzd ?? 0) +
    (motherboard?.priceDzd ?? 0) +
    ram.reduce((s, r) => s + r.priceDzd, 0) +
    (gpu?.priceDzd ?? 0) +
    (psu?.priceDzd ?? 0) +
    (pcCase?.priceDzd ?? 0) +
    (cooler?.priceDzd ?? 0) +
    storage.reduce((s, r) => s + r.priceDzd, 0);

  return {
    compatible: errors.length === 0,
    errors,
    warnings,
    estimatedWattage,
    recommendedPsu,
    totalPrice,
  };
}

export type SlotKey = "cpu" | "motherboard" | "ram" | "gpu" | "storage" | "psu" | "case" | "cooler";

export type FilteredProduct<T> = {
  product: T;
  compatible: boolean;
  incompatibilityReason: string | null;
};

/**
 * Pre-filter products for a given slot based on current selection.
 * Returns all products annotated with compatibility info.
 *
 * Rule: missing spec data is treated as "unknown" (compatible with note),
 * not "incompatible". Only contradictory data blocks selection.
 */
export function filterCompatibleProducts<T extends { specs: ComponentSpec }>(
  products: T[],
  selection: ConfigSelection,
  slotKey: SlotKey
): FilteredProduct<T>[] {
  const { cpu, motherboard, ram = [], gpu, psu, case: pcCase, cooler } = selection;

  return products.map((product) => {
    const s = product.specs;
    const reasons: string[] = [];

    switch (slotKey) {
      case "cpu":
        if (motherboard && socketMismatch(s.socket, motherboard.specs.socket))
          reasons.push(`Socket ${s.socket} ≠ ${motherboard.specs.socket}`);
        if (cooler) {
          const cs = toSocketList(cooler.specs.socket);
          if (cs.length && listExcludes(cs, s.socket))
            reasons.push(`Ventirad incompatible avec ${s.socket}`);
        }
        break;

      case "motherboard":
        if (cpu && socketMismatch(s.socket, cpu.specs.socket))
          reasons.push(`Socket ${s.socket} ≠ ${cpu.specs.socket}`);
        if (ram.length) {
          const rt = norm(ram[0].specs.ramType);
          const mt = norm(s.ramType);
          if (rt && mt && rt !== mt)
            reasons.push(`RAM ${ram[0].specs.ramType} ≠ ${s.ramType}`);
        }
        if (pcCase) {
          const supported = toFormFactorList(pcCase.specs.supportedFormFactors);
          const ff = norm(s.formFactor);
          if (supported.length && ff && !supported.includes(ff))
            reasons.push(`${s.formFactor} non supporté par le boîtier`);
        }
        break;

      case "ram":
        if (motherboard) {
          const rt = norm(s.ramType);
          const mt = norm(motherboard.specs.ramType);
          if (rt && mt && rt !== mt)
            reasons.push(`${s.ramType} ≠ ${motherboard.specs.ramType}`);
        }
        break;

      case "gpu":
        if (pcCase && typeof s.lengthMm === "number" && typeof pcCase.specs.maxGpuLengthMm === "number" && s.lengthMm > pcCase.specs.maxGpuLengthMm)
          reasons.push(`${s.lengthMm}mm > ${pcCase.specs.maxGpuLengthMm}mm max`);
        break;

      case "storage":
        if (
          motherboard &&
          motherboard.specs.m2Slots === 0 &&
          typeof s.interface === "string" &&
          s.interface.toLowerCase().includes("nvme")
        )
          reasons.push("Carte mère sans slot M.2");
        break;

      case "psu": {
        const cpuW = cpu?.specs.tdp ?? 0;
        const gpuW = gpu?.specs.tdp ?? 0;
        const base = 100;
        const recommended = Math.ceil(((cpuW + gpuW + base) * 1.3) / 50) * 50;
        if (cpu && typeof s.wattage === "number" && s.wattage < recommended)
          reasons.push(`${s.wattage}W < ${recommended}W recommandés`);
        break;
      }

      case "case":
        if (motherboard) {
          const supported = toFormFactorList(s.supportedFormFactors);
          const mbFF = norm(motherboard.specs.formFactor);
          if (supported.length && mbFF && !supported.includes(mbFF))
            reasons.push(`${motherboard.specs.formFactor} non supporté`);
        }
        if (gpu && typeof s.maxGpuLengthMm === "number" && typeof gpu.specs.lengthMm === "number" && s.maxGpuLengthMm < gpu.specs.lengthMm)
          reasons.push(`GPU ${gpu.specs.lengthMm}mm > ${s.maxGpuLengthMm}mm max`);
        if (cooler && typeof s.maxCoolerHeightMm === "number" && typeof cooler.specs.heightMm === "number" && s.maxCoolerHeightMm < cooler.specs.heightMm)
          reasons.push(`Ventirad ${cooler.specs.heightMm}mm > ${s.maxCoolerHeightMm}mm max`);
        break;

      case "cooler": {
        if (cpu) {
          const cs = toSocketList(s.socket);
          // Only flag as incompatible when the cooler explicitly lists sockets and the CPU socket isn't there.
          // Missing socket data → assume universal modern mounting (don't block).
          if (cs.length && listExcludes(cs, cpu.specs.socket))
            reasons.push(`Incompatible avec ${cpu.specs.socket}`);
        }
        if (pcCase && typeof s.heightMm === "number" && typeof pcCase.specs.maxCoolerHeightMm === "number" && s.heightMm > pcCase.specs.maxCoolerHeightMm)
          reasons.push(`${s.heightMm}mm > ${pcCase.specs.maxCoolerHeightMm}mm max`);
        break;
      }
    }

    return {
      product,
      compatible: reasons.length === 0,
      incompatibilityReason: reasons.length > 0 ? reasons.join(" · ") : null,
    };
  });
}

export const CONFIG_SLOTS = [
  { key: "cpu", categorySlug: "processors", required: true },
  { key: "motherboard", categorySlug: "motherboards", required: true },
  { key: "ram", categorySlug: "ram", required: true },
  { key: "gpu", categorySlug: "graphics-cards", required: true },
  { key: "storage", categorySlug: "ssds", required: true },
  { key: "psu", categorySlug: "power-supplies", required: true },
  { key: "case", categorySlug: "cases", required: true },
  { key: "cooler", categorySlug: "cpu-cooling", required: false },
] as const;
