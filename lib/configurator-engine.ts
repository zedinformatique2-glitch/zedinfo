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

export function checkCompatibility(sel: ConfigSelection): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { cpu, motherboard, ram = [], gpu, psu, case: pcCase, cooler, storage = [] } = sel;

  // Socket match
  if (cpu && motherboard) {
    if (cpu.specs.socket !== motherboard.specs.socket) {
      errors.push(
        `Socket incompatible: CPU (${cpu.specs.socket}) ≠ carte mère (${motherboard.specs.socket})`
      );
    }
  }

  // RAM type
  if (ram.length && motherboard) {
    const bad = ram.find((r) => r.specs.ramType !== motherboard.specs.ramType);
    if (bad) {
      errors.push(
        `Type de RAM incompatible: ${bad.specs.ramType} ≠ ${motherboard.specs.ramType}`
      );
    }
  }

  // RAM slots
  if (ram.length && motherboard) {
    const totalSticks = ram.reduce((s, r) => s + (r.specs.sticks ?? 1), 0);
    if (totalSticks > motherboard.specs.ramSlots) {
      errors.push(
        `Trop de barrettes RAM: ${totalSticks} > ${motherboard.specs.ramSlots} slots`
      );
    }
  }

  // RAM capacity
  if (ram.length && motherboard) {
    const totalGb = ram.reduce((s, r) => s + (r.specs.sizeGb ?? 0), 0);
    if (totalGb > motherboard.specs.maxRam) {
      errors.push(`Capacité RAM trop élevée: ${totalGb}GB > ${motherboard.specs.maxRam}GB`);
    }
  }

  // Form factor
  if (motherboard && pcCase) {
    const supported: string[] = pcCase.specs.supportedFormFactors ?? [];
    if (!supported.includes(motherboard.specs.formFactor)) {
      errors.push(
        `Format incompatible: ${motherboard.specs.formFactor} non supporté par le boîtier`
      );
    }
  }

  // GPU length
  if (gpu && pcCase) {
    if (gpu.specs.lengthMm > pcCase.specs.maxGpuLengthMm) {
      errors.push(
        `GPU trop long: ${gpu.specs.lengthMm}mm > ${pcCase.specs.maxGpuLengthMm}mm`
      );
    }
  }

  // Cooler height
  if (cooler && pcCase) {
    if (cooler.specs.heightMm > pcCase.specs.maxCoolerHeightMm) {
      warnings.push(
        `Hauteur du ventirad: ${cooler.specs.heightMm}mm > ${pcCase.specs.maxCoolerHeightMm}mm`
      );
    }
  }

  // Cooler socket
  if (cooler && cpu) {
    const sockets: string[] = cooler.specs.socket ?? [];
    if (!sockets.includes(cpu.specs.socket)) {
      errors.push(`Ventirad non compatible avec le socket ${cpu.specs.socket}`);
    }
  }

  // Cooler TDP
  if (cooler && cpu) {
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
  if (psu) {
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
        if (motherboard && s.socket !== motherboard.specs.socket)
          reasons.push(`Socket ${s.socket} ≠ ${motherboard.specs.socket}`);
        if (cooler && !(cooler.specs.socket as string[] | undefined)?.includes(s.socket))
          reasons.push(`Ventirad incompatible avec ${s.socket}`);
        break;

      case "motherboard":
        if (cpu && s.socket !== cpu.specs.socket)
          reasons.push(`Socket ${s.socket} ≠ ${cpu.specs.socket}`);
        if (ram.length && ram[0].specs.ramType !== s.ramType)
          reasons.push(`RAM ${ram[0].specs.ramType} ≠ ${s.ramType}`);
        if (pcCase) {
          const supported: string[] = pcCase.specs.supportedFormFactors ?? [];
          if (!supported.includes(s.formFactor))
            reasons.push(`${s.formFactor} non supporté par le boîtier`);
        }
        break;

      case "ram":
        if (motherboard && s.ramType !== motherboard.specs.ramType)
          reasons.push(`${s.ramType} ≠ ${motherboard.specs.ramType}`);
        break;

      case "gpu":
        if (pcCase && s.lengthMm > pcCase.specs.maxGpuLengthMm)
          reasons.push(`${s.lengthMm}mm > ${pcCase.specs.maxGpuLengthMm}mm max`);
        break;

      case "storage":
        if (
          motherboard &&
          motherboard.specs.m2Slots !== undefined &&
          motherboard.specs.m2Slots === 0 &&
          s.interface?.toLowerCase().includes("nvme")
        )
          reasons.push("Carte mère sans slot M.2");
        break;

      case "psu": {
        const cpuW = cpu?.specs.tdp ?? 0;
        const gpuW = gpu?.specs.tdp ?? 0;
        const base = 100;
        const recommended = Math.ceil(((cpuW + gpuW + base) * 1.3) / 50) * 50;
        if (cpu && s.wattage < recommended)
          reasons.push(`${s.wattage}W < ${recommended}W recommandés`);
        break;
      }

      case "case":
        if (motherboard) {
          const supported: string[] = s.supportedFormFactors ?? [];
          if (!supported.includes(motherboard.specs.formFactor))
            reasons.push(`${motherboard.specs.formFactor} non supporté`);
        }
        if (gpu && s.maxGpuLengthMm < gpu.specs.lengthMm)
          reasons.push(`GPU ${gpu.specs.lengthMm}mm > ${s.maxGpuLengthMm}mm max`);
        if (cooler && s.maxCoolerHeightMm < cooler.specs.heightMm)
          reasons.push(`Ventirad ${cooler.specs.heightMm}mm > ${s.maxCoolerHeightMm}mm max`);
        break;

      case "cooler":
        if (cpu && !(s.socket as string[] | undefined)?.includes(cpu.specs.socket))
          reasons.push(`Incompatible avec ${cpu.specs.socket}`);
        if (pcCase && s.heightMm > pcCase.specs.maxCoolerHeightMm)
          reasons.push(`${s.heightMm}mm > ${pcCase.specs.maxCoolerHeightMm}mm max`);
        break;
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
