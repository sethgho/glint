/**
 * Generate upscaled preview images for README
 * 8x nearest-neighbor upscale: 64x32 → 512x256
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
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

async function upscale(input: Buffer, name: string) {
  await sharp(input)
    .resize(OUT_W, OUT_H, { kernel: 'nearest' })
    .png()
    .toFile(join(OUT, `${name}.png`));
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  console.log('Generating README assets...');

  // Hero: default style "excited"
  const heroCanvas = drawEmotion(getEmotion('excited'));
  const heroPng = await sharp(heroCanvas.toBuffer(), { raw: { width: WIDTH, height: HEIGHT, channels: 4 } }).png().toBuffer();
  await upscale(heroPng, 'hero-excited');

  // Default style: happy
  const defaultCanvas = drawEmotion(getEmotion('happy'));
  const defaultPng = await sharp(defaultCanvas.toBuffer(), { raw: { width: WIDTH, height: HEIGHT, channels: 4 } }).png().toBuffer();
  await upscale(defaultPng, 'default-happy');

  // Image-based styles
  const imageStyles: [string, string][] = [
    ['ai-v1', 'neutral'],
    ['anime', 'happy'],
    ['pixel-art', 'excited'],
  ];

  for (const [style, emotion] of imageStyles) {
    const buf = await loadEmotionImage(style, emotion);
    await upscale(buf, `${style}-${emotion}`);
  }

  console.log(`Done! ${3 + imageStyles.length} images in assets/readme/`);
}

main().catch(console.error);
