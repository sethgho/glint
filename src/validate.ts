/**
 * Validation for glint style directories
 */

import sharp from 'sharp';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

export const REQUIRED_EMOTIONS = [
  'neutral', 'happy', 'sad', 'angry', 'surprised',
  'worried', 'sleepy', 'excited', 'confused', 'focused',
] as const;

export const EXPECTED_WIDTH = 64;
export const EXPECTED_HEIGHT = 32;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a style directory containing emotion PNGs
 */
export async function validateStyleDirectory(dirPath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(dirPath)) {
    return { valid: false, errors: [`Directory does not exist: ${dirPath}`], warnings };
  }

  const files = readdirSync(dirPath).filter(f => f.endsWith('.png'));
  const emotionNames = files.map(f => f.replace('.png', ''));

  // Check for required emotions
  const missing = REQUIRED_EMOTIONS.filter(e => !emotionNames.includes(e));
  if (missing.length > 0) {
    errors.push(`Missing emotions: ${missing.join(', ')}`);
  }

  // Check for extra files
  const nonPng = readdirSync(dirPath).filter(f => !f.endsWith('.png') && !f.startsWith('.'));
  if (nonPng.length > 0) {
    warnings.push(`Unexpected non-PNG files: ${nonPng.join(', ')}`);
  }

  // Check dimensions of existing emotion PNGs
  const dimensionErrors: string[] = [];
  for (const file of files) {
    const filePath = join(dirPath, file);
    try {
      const metadata = await sharp(filePath).metadata();
      if (metadata.width !== EXPECTED_WIDTH || metadata.height !== EXPECTED_HEIGHT) {
        dimensionErrors.push(
          `${file} is ${metadata.width}x${metadata.height}, expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`
        );
      }
    } catch (e) {
      errors.push(`Could not read ${file}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (dimensionErrors.length > 0) {
    errors.push(`Wrong dimensions: ${dimensionErrors.join('; ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
