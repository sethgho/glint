/**
 * Validation for glint style directories
 * Supports both SVG (recommended) and PNG (legacy) formats
 */

import sharp from 'sharp';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export const REQUIRED_EMOTIONS = [
  'neutral', 'happy', 'sad', 'angry', 'surprised',
  'worried', 'sleepy', 'excited', 'confused', 'focused',
] as const;

export const EXPECTED_WIDTH = 64;
export const EXPECTED_HEIGHT = 32;
export const MAX_SVG_SIZE = 100 * 1024; // 100KB

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate SVG file
 */
function validateSVG(filePath: string): { valid: boolean; error?: string } {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Basic SVG checks
    if (!content.includes('<svg')) {
      return { valid: false, error: 'Not a valid SVG file (missing <svg> tag)' };
    }
    
    // Check file size
    const size = Buffer.byteLength(content, 'utf-8');
    if (size > MAX_SVG_SIZE) {
      return { valid: false, error: `SVG too large: ${(size / 1024).toFixed(1)}KB > ${MAX_SVG_SIZE / 1024}KB` };
    }
    
    // Check for viewBox (important for scaling)
    if (!content.includes('viewBox')) {
      return { valid: false, error: 'SVG missing viewBox attribute (required for scaling)' };
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, error: `Could not read SVG: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/**
 * Validate a style directory containing emotion SVGs or PNGs
 */
export async function validateStyleDirectory(dirPath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(dirPath)) {
    return { valid: false, errors: [`Directory does not exist: ${dirPath}`], warnings };
  }

  const allFiles = readdirSync(dirPath);
  const svgFiles = allFiles.filter(f => f.endsWith('.svg'));
  const pngFiles = allFiles.filter(f => f.endsWith('.png'));
  
  // Determine format
  const hasSVG = svgFiles.length > 0;
  const hasPNG = pngFiles.length > 0;
  
  if (!hasSVG && !hasPNG) {
    return { valid: false, errors: ['No SVG or PNG files found'], warnings };
  }
  
  if (hasSVG && hasPNG) {
    warnings.push('Both SVG and PNG files found - SVG will take precedence');
  }
  
  const files = hasSVG ? svgFiles : pngFiles;
  const format = hasSVG ? 'svg' : 'png';
  const emotionNames = files.map(f => f.replace(/\.(svg|png)$/, ''));

  // Check for required emotions
  const missing = REQUIRED_EMOTIONS.filter(e => !emotionNames.includes(e));
  if (missing.length > 0) {
    errors.push(`Missing emotions: ${missing.join(', ')}`);
  }

  // Format-specific validation
  if (format === 'svg') {
    // Validate SVG files
    for (const file of svgFiles) {
      const filePath = join(dirPath, file);
      const result = validateSVG(filePath);
      if (!result.valid) {
        errors.push(`${file}: ${result.error}`);
      }
    }
  } else {
    // Validate PNG dimensions
    const dimensionErrors: string[] = [];
    for (const file of pngFiles) {
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
  }

  // Check for unexpected files
  const expectedExtensions = ['.svg', '.png', '.json', '.md', '.gif'];
  const unexpected = allFiles.filter(f => 
    !f.startsWith('.') && 
    !expectedExtensions.some(ext => f.endsWith(ext))
  );
  if (unexpected.length > 0) {
    warnings.push(`Unexpected files: ${unexpected.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
