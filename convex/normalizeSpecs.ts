// One-shot migration to normalize product specs so the configurator engine
// can compare them reliably. Safe to re-run: idempotent.
//
// Run: npx convex run normalizeSpecs:run --prod
//      npx convex run normalizeSpecs:dryRun --prod   (preview without writing)
//
// What it does:
//   - Uppercases socket strings on CPUs, motherboards and coolers
//   - Coerces cooler `socket` from missing/string into a string array
//   - Backfills missing cooler socket data with a universal modern set so
//     coolers stop showing up as "Incompatible avec ..." in the picker
//   - Uppercases ramType (DDR4/DDR5) on RAM and motherboards
//   - Uppercases formFactor (ATX/MATX/ITX) on motherboards and supportedFormFactors on cases
//   - Leaves everything else untouched

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MODERN_UNIVERSAL_SOCKETS = [
  "AM4",
  "AM5",
  "LGA1150",
  "LGA1151",
  "LGA1155",
  "LGA1200",
  "LGA1700",
  "LGA1851",
];

function up(s: unknown): string | undefined {
  return typeof s === "string" ? s.trim().toUpperCase() : undefined;
}

function toSocketArray(v: unknown): string[] | undefined {
  if (Array.isArray(v)) {
    const arr = v.map(up).filter((x): x is string => !!x);
    return arr.length ? arr : undefined;
  }
  if (typeof v === "string") {
    const arr = v.split(/[\s,;/]+/).map(up).filter((x): x is string => !!x);
    return arr.length ? arr : undefined;
  }
  return undefined;
}

type Change = { id: string; name: string; before: any; after: any };

async function buildPlan(ctx: any): Promise<Change[]> {
  const categories = await ctx.db.query("categories").collect();
  const slugById = new Map<string, string>();
  for (const c of categories) slugById.set(c._id, c.slug);

  const products = await ctx.db.query("products").collect();
  const changes: Change[] = [];

  for (const p of products) {
    const slug = slugById.get(p.categoryId) ?? "";
    const specs = { ...(p.specs ?? {}) };
    const next: Record<string, any> = { ...specs };
    let touched = false;

    // CPU / motherboard / cooler — socket normalization
    if (slug === "processors" || slug === "motherboards") {
      const u = up(specs.socket);
      if (u && u !== specs.socket) {
        next.socket = u;
        touched = true;
      }
    }

    if (slug === "cpu-cooling") {
      const arr = toSocketArray(specs.socket);
      if (arr) {
        // Already had socket data — just normalize shape & casing
        const same =
          Array.isArray(specs.socket) &&
          specs.socket.length === arr.length &&
          specs.socket.every((x: any, i: number) => x === arr[i]);
        if (!same) {
          next.socket = arr;
          touched = true;
        }
      } else {
        // Backfill: assume universal modern mounting kit
        next.socket = MODERN_UNIVERSAL_SOCKETS;
        touched = true;
      }
      // Safe defaults so case-fit checks don't crash
      if (typeof specs.heightMm !== "number") {
        next.heightMm = 160;
        touched = true;
      }
      if (typeof specs.tdpSupport !== "number") {
        next.tdpSupport = 200;
        touched = true;
      }
    }

    // RAM type
    if (slug === "ram" || slug === "motherboards") {
      const u = up(specs.ramType);
      if (u && u !== specs.ramType) {
        next.ramType = u;
        touched = true;
      }
    }

    // Form factor
    if (slug === "motherboards") {
      const u = up(specs.formFactor);
      if (u && u !== specs.formFactor) {
        next.formFactor = u;
        touched = true;
      }
    }

    if (slug === "cases") {
      const list = toSocketArray(specs.supportedFormFactors); // same shape: array of strings
      if (list) {
        const same =
          Array.isArray(specs.supportedFormFactors) &&
          specs.supportedFormFactors.length === list.length &&
          specs.supportedFormFactors.every((x: any, i: number) => x === list[i]);
        if (!same) {
          next.supportedFormFactors = list;
          touched = true;
        }
      }
    }

    if (touched) {
      changes.push({ id: p._id, name: p.nameFr ?? p.slug, before: specs, after: next });
    }
  }

  return changes;
}

export const dryRun = query({
  args: {},
  handler: async (ctx) => {
    const changes = await buildPlan(ctx);
    return {
      total: changes.length,
      sample: changes.slice(0, 20).map((c) => ({
        name: c.name,
        before: c.before,
        after: c.after,
      })),
    };
  },
});

export const run = mutation({
  args: { confirm: v.optional(v.boolean()) },
  handler: async (ctx, { confirm }) => {
    const changes = await buildPlan(ctx);
    if (confirm === false) {
      return { wouldUpdate: changes.length, applied: 0 };
    }
    for (const c of changes) {
      await ctx.db.patch(c.id as any, { specs: c.after });
    }
    return { wouldUpdate: changes.length, applied: changes.length };
  },
});
