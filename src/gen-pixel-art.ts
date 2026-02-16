/**
 * Generate pixel-art style emotion images for glint
 * Retro game aesthetic — chunky pixels, bold outlines, limited palette
 * Canvas: 64x32
 */

import { PNG } from 'pngjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../assets/pixel-art');
mkdirSync(OUT_DIR, { recursive: true });

const W = 64;
const H = 32;

// Retro palette
const BG = [0, 0, 0] as const;           // black background
const WHITE = [255, 255, 255] as const;   // eye whites
const OUTLINE = [40, 40, 60] as const;    // dark outline
const PUPIL = [20, 180, 240] as const;    // blue pupil (our signature color)
const PUPIL_HI = [100, 220, 255] as const; // pupil highlight
const BROW = [200, 200, 220] as const;    // eyebrow color
const BLUSH = [255, 100, 120] as const;   // blush for happy/excited

type Color = readonly [number, number, number];

class PixelCanvas {
  buf: Uint8Array;
  constructor() {
    this.buf = new Uint8Array(W * H * 3);
  }

  set(x: number, y: number, c: Color) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] = c[0]; this.buf[i+1] = c[1]; this.buf[i+2] = c[2];
  }

  rect(x: number, y: number, w: number, h: number, c: Color) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        this.set(x + dx, y + dy, c);
  }

  // Outlined rect (1px border)
  outlinedRect(x: number, y: number, w: number, h: number, fill: Color, border: Color) {
    this.rect(x, y, w, h, border);
    this.rect(x + 1, y + 1, w - 2, h - 2, fill);
  }

  async save(name: string) {
    const png = new PNG({ width: W, height: H });
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const srcIdx = (y * W + x) * 3;
        const dstIdx = (y * W + x) * 4;
        png.data[dstIdx] = this.buf[srcIdx];
        png.data[dstIdx + 1] = this.buf[srcIdx + 1];
        png.data[dstIdx + 2] = this.buf[srcIdx + 2];
        png.data[dstIdx + 3] = 255;
      }
    }
    const path = join(OUT_DIR, `${name}.png`);
    writeFileSync(path, PNG.sync.write(png));
    console.log(`  ✓ ${name}.png`);
  }
}

// Helper: draw a pixel-art eye
function drawEye(c: PixelCanvas, cx: number, cy: number, w: number, h: number, pupilX: number, pupilY: number, pupilW: number, pupilH: number) {
  // Outline
  c.rect(cx - 1, cy - 1, w + 2, h + 2, OUTLINE);
  // White
  c.rect(cx, cy, w, h, WHITE);
  // Pupil
  const px = cx + pupilX;
  const py = cy + pupilY;
  c.rect(px, py, pupilW, pupilH, PUPIL);
  // Highlight (1px in top-left of pupil)
  if (pupilW >= 3 && pupilH >= 3) {
    c.set(px + 1, py + 1, PUPIL_HI);
  }
}

// Helper: draw angled eyebrow
function drawBrow(c: PixelCanvas, x: number, y: number, w: number, angle: number, thick: number = 2) {
  // angle: pixels to drop from left to right
  for (let dx = 0; dx < w; dx++) {
    const dy = Math.round(angle * dx / (w - 1));
    for (let t = 0; t < thick; t++) {
      c.set(x + dx, y + dy + t, BROW);
    }
  }
}

interface EmoDef {
  // Eye dimensions
  eyeW: number; eyeH: number;
  // Pupil position within eye (relative) and size
  pupilOx: number; pupilOy: number; pupilW: number; pupilH: number;
  // Brow: angle (pixels drop L→R for left eye; mirrored for right), yOffset from eye top
  browAngle: number; browY: number;
  // Optional extras
  blush?: boolean;
  zzzs?: boolean;
  sweatDrop?: boolean;
  sparkle?: boolean;
  exclamation?: boolean;
}

const LEFT_EYE_CX = 10;
const RIGHT_EYE_CX = 38;
const EYE_CY = 12;

const emotions: Record<string, EmoDef> = {
  neutral: {
    eyeW: 14, eyeH: 12,
    pupilOx: 4, pupilOy: 3, pupilW: 5, pupilH: 5,
    browAngle: 0, browY: -4,
  },
  happy: {
    eyeW: 14, eyeH: 9,
    pupilOx: 4, pupilOy: 2, pupilW: 5, pupilH: 5,
    browAngle: -1, browY: -4,
    blush: true,
  },
  sad: {
    eyeW: 14, eyeH: 10,
    pupilOx: 4, pupilOy: 4, pupilW: 5, pupilH: 4,
    browAngle: 3, browY: -5,
  },
  angry: {
    eyeW: 14, eyeH: 10,
    pupilOx: 4, pupilOy: 2, pupilW: 4, pupilH: 4,
    browAngle: -3, browY: -3,
  },
  surprised: {
    eyeW: 16, eyeH: 14,
    pupilOx: 5, pupilOy: 4, pupilW: 4, pupilH: 4,
    browAngle: 0, browY: -6,
    exclamation: true,
  },
  worried: {
    eyeW: 14, eyeH: 11,
    pupilOx: 4, pupilOy: 4, pupilW: 5, pupilH: 5,
    browAngle: 3, browY: -5,
    sweatDrop: true,
  },
  sleepy: {
    eyeW: 14, eyeH: 4,
    pupilOx: 4, pupilOy: 0, pupilW: 5, pupilH: 3,
    browAngle: 0, browY: -4,
    zzzs: true,
  },
  excited: {
    eyeW: 16, eyeH: 13,
    pupilOx: 4, pupilOy: 3, pupilW: 6, pupilH: 6,
    browAngle: -1, browY: -5,
    sparkle: true,
    blush: true,
  },
  confused: {
    eyeW: 14, eyeH: 11,
    pupilOx: 2, pupilOy: 3, pupilW: 5, pupilH: 5,
    browAngle: 2, browY: -5,
    exclamation: true,
  },
  focused: {
    eyeW: 14, eyeH: 8,
    pupilOx: 4, pupilOy: 1, pupilW: 5, pupilH: 5,
    browAngle: -2, browY: -3,
  },
};

async function generate() {
  console.log('Generating pixel-art style...');

  for (const [name, e] of Object.entries(emotions)) {
    const c = new PixelCanvas();

    // Left eye
    const lx = LEFT_EYE_CX;
    const ly = EYE_CY;
    drawEye(c, lx, ly, e.eyeW, e.eyeH, e.pupilOx, e.pupilOy, e.pupilW, e.pupilH);
    // Left brow (angle as-is)
    drawBrow(c, lx, ly + e.browY, e.eyeW, e.browAngle);

    // Right eye
    const rx = RIGHT_EYE_CX;
    const ry = EYE_CY;
    drawEye(c, rx, ry, e.eyeW, e.eyeH, e.eyeW - e.pupilOx - e.pupilW, e.pupilOy, e.pupilW, e.pupilH);
    // Right brow (mirrored angle)
    drawBrow(c, rx, ry + e.browY, e.eyeW, -e.browAngle);

    // Extras
    if (e.blush) {
      // Small blush marks below each eye
      c.rect(lx + 1, ly + e.eyeH + 2, 3, 2, BLUSH);
      c.rect(rx + e.eyeW - 4, ry + e.eyeH + 2, 3, 2, BLUSH);
    }

    if (e.zzzs) {
      // Zzz floating to the right
      const zx = rx + e.eyeW + 3;
      // Z1
      c.rect(zx, 6, 4, 1, BROW);
      c.set(zx + 3, 7, BROW);
      c.set(zx + 2, 8, BROW);
      c.set(zx + 1, 9, BROW);
      c.rect(zx, 10, 4, 1, BROW);
      // Z2 (smaller, higher)
      c.rect(zx + 5, 3, 3, 1, BROW);
      c.set(zx + 7, 4, BROW);
      c.set(zx + 6, 5, BROW);
      c.rect(zx + 5, 6, 3, 1, BROW);
    }

    if (e.sweatDrop) {
      // Small sweat drop to the right of right eye
      const sx = rx + e.eyeW + 2;
      c.set(sx, ry + 1, PUPIL);
      c.set(sx, ry + 2, PUPIL);
      c.set(sx - 1, ry + 3, PUPIL);
      c.set(sx, ry + 3, PUPIL_HI);
      c.set(sx + 1, ry + 3, PUPIL);
      c.set(sx, ry + 4, PUPIL);
    }

    if (e.sparkle) {
      // Small sparkle marks
      const sp = [255, 255, 100] as const;
      // Top-left sparkle
      c.set(5, 5, sp); c.set(4, 6, sp); c.set(6, 6, sp); c.set(5, 7, sp);
      // Top-right sparkle
      c.set(58, 4, sp); c.set(57, 5, sp); c.set(59, 5, sp); c.set(58, 6, sp);
    }

    if (e.exclamation) {
      // ? or ! mark
      const mx = name === 'confused' ? 32 : 32; // center top
      const my = 2;
      if (name === 'confused') {
        // ?
        c.rect(mx - 1, my, 3, 1, BROW);
        c.set(mx + 1, my + 1, BROW);
        c.set(mx, my + 2, BROW);
        c.set(mx, my + 3, BROW);
        c.set(mx, my + 5, BROW);
      } else {
        // !
        c.set(mx, my, BROW);
        c.set(mx, my + 1, BROW);
        c.set(mx, my + 2, BROW);
        c.set(mx, my + 4, BROW);
      }
    }

    await c.save(name);
  }

  console.log('Done! Generated', Object.keys(emotions).length, 'emotions');
}

generate().catch(console.error);
