import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

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
  const outPath = path.join(dir, f.replace(/\.jpg$/, ".webp"));
  try {
    const inSize = (await fs.stat(inPath)).size;
    await sharp(inPath)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(outPath);
    const outSize = (await fs.stat(outPath)).size;
    console.log(`${f}: ${(inSize / 1024).toFixed(0)} KB -> ${(outSize / 1024).toFixed(0)} KB`);
  } catch (e) {
    console.log(`${f}: SKIP (${e.message})`);
  }
}
