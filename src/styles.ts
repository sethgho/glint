/**
 * Style system for glint - supports programmatic, SVG, and PNG styles
 * SVG is now the recommended format (scales infinitely)
 */

import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '../assets');
const USER_STYLES_DIR = join(homedir(), '.config', 'glint', 'styles');

export type StyleType = 'programmatic' | 'image';
export type ImageFormat = 'svg' | 'png';

export interface Style {
  name: string;
  type: StyleType;
  description: string;
  userStyle?: boolean;
  format?: ImageFormat; // For image-based styles
}

export const BUILTIN_STYLES: Record<string, Style> = {
  'default': {
    name: 'default',
    type: 'programmatic',
    description: 'Programmatic cartoon eyes with eyebrows',
  },
  'ai-v1': {
    name: 'ai-v1',
    type: 'image',
    format: 'png',
    description: 'AI-generated cartoon eyes (flux-schnell)',
  },
  'anime': {
    name: 'anime',
    type: 'image',
    format: 'png',
    description: 'Anime-style eyes with sparkles and vibrant colors',
  },
  'pixel-art': {
    name: 'pixel-art',
    type: 'image',
    format: 'png',
    description: 'Retro pixel-art game-style eyes with chunky pixels and bold outlines',
  },
  'kawaii': {
    name: 'kawaii',
    type: 'image',
    format: 'svg',
    description: 'Big sparkly kawaii eyes — SVG format, scales infinitely',
  },
};

// Keep STYLES as alias for backward compat
export const STYLES = BUILTIN_STYLES;

/**
 * Discover user styles from ~/.config/glint/styles/
 */
export function discoverUserStyles(): Record<string, Style> {
  const userStyles: Record<string, Style> = {};

  if (!existsSync(USER_STYLES_DIR)) {
    return userStyles;
  }

  try {
    const entries = readdirSync(USER_STYLES_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const styleDir = join(USER_STYLES_DIR, entry.name);
      const files = readdirSync(styleDir);
      const svgs = files.filter(f => f.endsWith('.svg'));
      const pngs = files.filter(f => f.endsWith('.png'));
      
      if (svgs.length > 0) {
        userStyles[entry.name] = {
          name: entry.name,
          type: 'image',
          format: 'svg',
          description: `User style (${svgs.length} SVG emotions)`,
          userStyle: true,
        };
      } else if (pngs.length > 0) {
        userStyles[entry.name] = {
          name: entry.name,
          type: 'image',
          format: 'png',
          description: `User style (${pngs.length} PNG emotions)`,
          userStyle: true,
        };
      }
    }
  } catch {
    // Ignore errors reading user styles dir
  }

  return userStyles;
}

export function listStyles(): Style[] {
  return [...Object.values(BUILTIN_STYLES), ...Object.values(discoverUserStyles())];
}

export function getStyle(name: string): Style {
  const builtin = BUILTIN_STYLES[name];
  if (builtin) return builtin;

  const userStyles = discoverUserStyles();
  const user = userStyles[name];
  if (user) return user;

  const all = [...Object.keys(BUILTIN_STYLES), ...Object.keys(userStyles)];
  throw new Error(`Unknown style: ${name}. Available: ${all.join(', ')}`);
}

/**
 * Get the directory path for a style's assets
 */
export function getStyleDir(style: Style): string {
  if (style.userStyle) {
    return join(USER_STYLES_DIR, style.name);
  }
  return join(ASSETS_DIR, style.name);
}

/**
 * Render SVG to PNG buffer at specified dimensions
 */
export function renderSVGtoPNG(svgContent: string, width: number, height: number): Buffer {
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });
  
  const pngData = resvg.render();
  return pngData.asPng();
}

/**
 * Load an emotion image for a given style
 * Returns a 64x32 PNG buffer (rasterizes SVG if needed)
 */
export async function loadEmotionImage(
  styleName: string, 
  emotionName: string,
  width: number = 64,
  height: number = 32
): Promise<Buffer> {
  const style = getStyle(styleName);

  if (style.type !== 'image') {
    throw new Error(`Style "${styleName}" is not image-based`);
  }

  const styleDir = getStyleDir(style);
  
  // Try SVG first
  const svgPath = join(styleDir, `${emotionName}.svg`);
  if (existsSync(svgPath)) {
    const svgContent = readFileSync(svgPath, 'utf-8');
    return renderSVGtoPNG(svgContent, width, height);
  }
  
  // Fall back to PNG
  const pngPath = join(styleDir, `${emotionName}.png`);
  if (existsSync(pngPath)) {
    const buffer = await sharp(pngPath)
      .resize(width, height, { fit: 'fill' })
      .png()
      .toBuffer();
    return buffer;
  }

  throw new Error(`No image found for emotion "${emotionName}" in style "${styleName}"`);
}

/**
 * List available emotions for an image-based style
 */
export function listStyleEmotions(styleName: string): string[] {
  const style = getStyle(styleName);

  if (style.type !== 'image') {
    return [];
  }

  const styleDir = getStyleDir(style);

  if (!existsSync(styleDir)) {
    return [];
  }

  const files = readdirSync(styleDir);
  const emotions = new Set<string>();
  
  // Collect both SVG and PNG emotions
  files
    .filter(f => f.endsWith('.svg') || f.endsWith('.png'))
    .forEach(f => {
      const name = f.replace(/\.(svg|png)$/, '');
      emotions.add(name);
    });
  
  return Array.from(emotions);
}

export { USER_STYLES_DIR };
