import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

/**
 * In-place compression of category JPGs.
 * Overwrites originals at the same path so no code references change.
 */

const dir = path.join(process.cwd(), "public/categories/categories");
const files = [
  "motherboard.jpg",
  "gpu.jpg",
  "ram.jpg",
  "peripherals.jpg",
  "case.jpg",
  "cpu.jpg",
  "storage.jpg",
  "psu.jpg",
  "furniture.jpg",
];

for (const f of files) {
  const inPath = path.join(dir, f);
  const tmpPath = inPath + ".tmp";
  try {
    const inSize = (await fs.stat(inPath)).size;
    await sharp(inPath)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(tmpPath);
    await fs.rename(tmpPath, inPath);
    const outSize = (await fs.stat(inPath)).size;
    console.log(`${f}: ${(inSize / 1024).toFixed(0)} KB -> ${(outSize / 1024).toFixed(0)} KB`);
  } catch (e) {
    console.log(`${f}: SKIP (${e.message})`);
    try { await fs.unlink(tmpPath); } catch {}
  }
}
