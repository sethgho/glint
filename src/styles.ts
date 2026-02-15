/**
 * Style system for glint - supports both programmatic and image-based styles
 */

import sharp from 'sharp';
import { existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '../assets');
const USER_STYLES_DIR = join(homedir(), '.config', 'glint', 'styles');

export type StyleType = 'programmatic' | 'image';

export interface Style {
  name: string;
  type: StyleType;
  description: string;
  userStyle?: boolean;
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
    description: 'AI-generated cartoon eyes (flux-schnell)',
  },
  'anime': {
    name: 'anime',
    type: 'image',
    description: 'Anime-style eyes with sparkles and vibrant colors',
  },
  'pixel-art': {
    name: 'pixel-art',
    type: 'image',
    description: 'Retro pixel-art game-style eyes with chunky pixels and bold outlines',
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
      const pngs = readdirSync(styleDir).filter(f => f.endsWith('.png'));
      if (pngs.length > 0) {
        userStyles[entry.name] = {
          name: entry.name,
          type: 'image',
          description: `User style (${pngs.length} emotions)`,
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
 * Load an emotion image for a given style
 * Returns a 64x32 PNG buffer
 */
export async function loadEmotionImage(styleName: string, emotionName: string): Promise<Buffer> {
  const style = getStyle(styleName);

  if (style.type !== 'image') {
    throw new Error(`Style "${styleName}" is not image-based`);
  }

  const assetPath = join(getStyleDir(style), `${emotionName}.png`);

  if (!existsSync(assetPath)) {
    throw new Error(`No image found for emotion "${emotionName}" in style "${styleName}"`);
  }

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
    return [];
  }

  const styleDir = getStyleDir(style);

  if (!existsSync(styleDir)) {
    return [];
  }

  return readdirSync(styleDir)
    .filter(f => f.endsWith('.png'))
    .map(f => f.replace('.png', ''));
}

export { USER_STYLES_DIR };
