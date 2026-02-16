/**
 * Generate upscaled preview images for README
 * 8x nearest-neighbor upscale: 64x32 → 512x256
 */
import { PNG } from 'pngjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, writeFileSync } from 'fs';
import { drawEmotion } from './draw';
import { getEmotion } from './emotions';
import { loadEmotionImage } from './styles';
import { WIDTH, HEIGHT } from './canvas';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../assets/readme');
mkdirSync(OUT, { recursive: true });

const SCALE = 8;
const OUT_W = WIDTH * SCALE;   // 512
const OUT_H = HEIGHT * SCALE;  // 256

/**
 * Nearest-neighbor upscale a raw RGBA buffer, then write as PNG
 */
function upscaleRGBA(rgba: Buffer, srcW: number, srcH: number, name: string) {
  const png = new PNG({ width: OUT_W, height: OUT_H });
  for (let y = 0; y < OUT_H; y++) {
    const sy = Math.floor(y / SCALE);
    for (let x = 0; x < OUT_W; x++) {
      const sx = Math.floor(x / SCALE);
      const srcIdx = (sy * srcW + sx) * 4;
      const dstIdx = (y * OUT_W + x) * 4;
      png.data[dstIdx] = rgba[srcIdx];
      png.data[dstIdx + 1] = rgba[srcIdx + 1];
      png.data[dstIdx + 2] = rgba[srcIdx + 2];
      png.data[dstIdx + 3] = rgba[srcIdx + 3];
    }
  }
  writeFileSync(join(OUT, `${name}.png`), PNG.sync.write(png));
  console.log(`  ✓ ${name}.png`);
}

async function upscaleFromPng(pngBuffer: Buffer, name: string) {
  const decoded = PNG.sync.read(pngBuffer);
  upscaleRGBA(decoded.data as unknown as Buffer, decoded.width, decoded.height, name);
}

async function main() {
  console.log('Generating README assets...');

  // Hero: default style "excited"
  const heroCanvas = drawEmotion(getEmotion('excited'));
  upscaleRGBA(heroCanvas.toBuffer(), WIDTH, HEIGHT, 'hero-excited');

  // Default style: happy
  const defaultCanvas = drawEmotion(getEmotion('happy'));
  upscaleRGBA(defaultCanvas.toBuffer(), WIDTH, HEIGHT, 'default-happy');

  // Image-based styles
  const imageStyles: [string, string][] = [
    ['ai-v1', 'neutral'],
    ['anime', 'happy'],
    ['pixel-art', 'excited'],
  ];

  for (const [style, emotion] of imageStyles) {
    const buf = await loadEmotionImage(style, emotion);
    await upscaleFromPng(buf, `${style}-${emotion}`);
  }

  console.log(`Done! ${3 + imageStyles.length} images in assets/readme/`);
}

main().catch(console.error);
