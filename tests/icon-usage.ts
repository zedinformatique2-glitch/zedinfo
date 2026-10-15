import fs from "node:fs";
import path from "node:path";

/**
 * Finds every Material Symbols name the public site writes in its source:
 * <Icon name="x">, ternaries inside name={...}, icon: "x" / icon="x" fields,
 * text inside material-symbols-outlined spans (literal or {a ? "x" : "y"}),
 * and the values of *_ICONS lookup maps. Admin code is skipped: the admin
 * layout loads the full icon font.
 */
const ROOTS = ["app", "components", "lib"];
const SKIP = [/^app[\\/]admin/, /^components[\\/]admin/];

const NAME = /^[a-z][a-z0-9_]*$/;
// Strings an expression can evaluate to: the whole expression or a ternary
// branch. Skips comparison operands such as kind === "loaded".
const quoted = (s: string) =>
  [...s.matchAll(/(?:^|[?:])\s*["']([a-z][a-z0-9_]*)["']/g)].map((m) => m[1]);

export function iconNamesInSource(src: string): string[] {
  const found = new Set<string>();
  const add = (n: string) => NAME.test(n) && found.add(n);
  for (const m of src.matchAll(/<Icon\b[^>]*?\bname=(?:"([^"]+)"|\{([^}]*)\})/g)) {
    if (m[1]) add(m[1]);
    else quoted(m[2]).forEach(add);
  }
  for (const m of src.matchAll(/\bicon\s*[:=]\s*["']([a-z][a-z0-9_]*)["']/g)) add(m[1]);
  for (const m of src.matchAll(/material-symbols-outlined[^>]*>\s*([a-z][a-z0-9_]*)\s*</g)) add(m[1]);
  for (const m of src.matchAll(/material-symbols-outlined[^>]*>\s*\{([^}]*)\}\s*</g)) quoted(m[1]).forEach(add);
  for (const m of src.matchAll(/_ICONS[^=]*=\s*\{([^}]*)\}/g)) {
    for (const v of m[1].matchAll(/:\s*["']([a-z][a-z0-9_]*)["']/g)) add(v[1]);
  }
  return [...found];
}

export function publicIconUsage(repoRoot: string): Map<string, string[]> {
  const usage = new Map<string, string[]>();
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      const rel = path.relative(repoRoot, p);
      if (SKIP.some((r) => r.test(rel))) continue;
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name)) {
        for (const n of iconNamesInSource(fs.readFileSync(p, "utf8"))) {
          usage.set(n, [...(usage.get(n) ?? []), rel]);
        }
      }
    }
  };
  for (const r of ROOTS) walk(path.join(repoRoot, r));
  return usage;
}
