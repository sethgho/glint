/**
 * Style system for glint - supports both programmatic and image-based styles
 */

import sharp from 'sharp';
import { existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '../assets');

export type StyleType = 'programmatic' | 'image';

export interface Style {
  name: string;
  type: StyleType;
  description: string;
}

export const STYLES: Record<string, Style> = {
  'default': {
    name: 'default',
    type: 'programmatic',
    description: 'Programmatic cartoon eyes with eyebrows',
  },
  'ai-v1': {
    name: 'ai-v1',
    type: 'image',
    description: 'AI-generated cartoon eyes (flux-schnell)',
  },
  'anime': {
    name: 'anime',
    type: 'image',
    description: 'Anime-style eyes with sparkles and vibrant colors',
  },
};

export function listStyles(): Style[] {
  return Object.values(STYLES);
}

export function getStyle(name: string): Style {
  const style = STYLES[name];
  if (!style) {
    throw new Error(`Unknown style: ${name}. Available: ${Object.keys(STYLES).join(', ')}`);
  }
  return style;
}

/**
 * Load an emotion image for a given style
 * Returns a 64x32 PNG buffer
 */
export async function loadEmotionImage(styleName: string, emotionName: string): Promise<Buffer> {
  const style = getStyle(styleName);
  
  if (style.type !== 'image') {
    throw new Error(`Style "${styleName}" is not image-based`);
  }
  
  const assetPath = join(ASSETS_DIR, styleName, `${emotionName}.png`);
  
  if (!existsSync(assetPath)) {
    throw new Error(`No image found for emotion "${emotionName}" in style "${styleName}"`);
  }
  
  // Load and ensure correct size
  const buffer = await sharp(assetPath)
    .resize(64, 32, { fit: 'fill' })
    .png()
    .toBuffer();
  
  return buffer;
}

/**
 * List available emotions for an image-based style
 */
export function listStyleEmotions(styleName: string): string[] {
  const style = getStyle(styleName);
  
  if (style.type !== 'image') {
    return []; // Programmatic styles define emotions differently
  }
  
  const styleDir = join(ASSETS_DIR, styleName);
  
  if (!existsSync(styleDir)) {
    return [];
  }
  
  return readdirSync(styleDir)
    .filter(f => f.endsWith('.png'))
    .map(f => f.replace('.png', ''));
}
