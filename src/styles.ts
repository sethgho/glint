/**
 * Style system for glint - supports programmatic and SVG styles
 * All image-based styles are SVG (scales infinitely)
 */

import { Resvg } from '@resvg/resvg-js';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '../assets');
const USER_STYLES_DIR = join(homedir(), '.config', 'glint', 'styles');

export type StyleType = 'programmatic' | 'svg';

export interface StyleMetadata {
  name: string;
  displayName?: string;
  description?: string;
  author?: string;
  version?: string;
  animated?: boolean;
  fps?: number;
  duration?: number;
  emotions?: string[];
  tags?: string[];
}

export interface Style {
  name: string;
  type: StyleType;
  description: string;
  userStyle?: boolean;
  animated?: boolean;
  metadata?: StyleMetadata;
}

export const BUILTIN_STYLES: Record<string, Style> = {
  'default': {
    name: 'default',
    type: 'programmatic',
    description: 'Programmatic cartoon eyes with eyebrows',
  },
  'kawaii': {
    name: 'kawaii',
    type: 'svg',
    description: 'Big sparkly kawaii eyes with vibrant colors',
  },
  'kawaii-animated': {
    name: 'kawaii-animated',
    type: 'svg',
    description: 'Animated kawaii eyes with blinking, sparkling, and emotional movements',
    animated: true,
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
      
      if (svgs.length > 0) {
        userStyles[entry.name] = {
          name: entry.name,
          type: 'svg',
          description: `User style (${svgs.length} SVG emotions)`,
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
 * Load style metadata from glint-style.json if it exists
 */
export function loadStyleMetadata(style: Style): StyleMetadata | null {
  if (style.metadata) return style.metadata;
  
  const styleDir = getStyleDir(style);
  const metadataPath = join(styleDir, 'glint-style.json');
  
  if (!existsSync(metadataPath)) {
    return null;
  }
  
  try {
    const content = readFileSync(metadataPath, 'utf-8');
    return JSON.parse(content) as StyleMetadata;
  } catch {
    return null;
  }
}

/**
 * Get animation parameters for a style
 */
export function getAnimationParams(styleName: string): { fps: number; duration: number } {
  const style = getStyle(styleName);
  const metadata = loadStyleMetadata(style);
  
  return {
    fps: metadata?.fps || 15,
    duration: metadata?.duration || 3.0,
  };
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
 * Load an emotion SVG and rasterize to PNG (or multiple frames if animated)
 * Returns a PNG buffer or array of PNG buffers for animated styles
 */
export async function loadEmotionImage(
  styleName: string, 
  emotionName: string,
  width: number = 64,
  height: number = 32
): Promise<Buffer | Buffer[]> {
  const style = getStyle(styleName);

  if (style.type !== 'svg') {
    throw new Error(`Style "${styleName}" is not SVG-based`);
  }

  const styleDir = getStyleDir(style);
  const svgPath = join(styleDir, `${emotionName}.svg`);
  
  if (!existsSync(svgPath)) {
    throw new Error(`No SVG found for emotion "${emotionName}" in style "${styleName}"`);
  }
  
  const svgContent = readFileSync(svgPath, 'utf-8');
  
  // Check if animated
  const { isAnimated, renderAnimatedFrames } = await import('./animate');
  
  if (style.animated && isAnimated(svgContent)) {
    const { fps, duration } = getAnimationParams(styleName);
    return renderAnimatedFrames(svgContent, fps, duration, width, height);
  }
  
  return renderSVGtoPNG(svgContent, width, height);
}

/**
 * List available emotions for an SVG-based style
 */
export function listStyleEmotions(styleName: string): string[] {
  const style = getStyle(styleName);

  if (style.type !== 'svg') {
    return [];
  }

  const styleDir = getStyleDir(style);

  if (!existsSync(styleDir)) {
    return [];
  }

  return readdirSync(styleDir)
    .filter(f => f.endsWith('.svg'))
    .map(f => f.replace('.svg', ''));
}

export { USER_STYLES_DIR };
