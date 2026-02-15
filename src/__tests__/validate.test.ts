import { describe, it, expect } from 'bun:test';
import { validateStyleDirectory, REQUIRED_EMOTIONS } from '../validate';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '../../assets');

describe('validate', () => {
  it('validates ai-v1 as valid', async () => {
    const result = await validateStyleDirectory(join(ASSETS_DIR, 'ai-v1'));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates anime as valid', async () => {
    const result = await validateStyleDirectory(join(ASSETS_DIR, 'anime'));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates pixel-art as valid', async () => {
    const result = await validateStyleDirectory(join(ASSETS_DIR, 'pixel-art'));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns error for nonexistent directory', async () => {
    const result = await validateStyleDirectory('/tmp/nonexistent-glint-style');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('does not exist');
  });

  it('exports REQUIRED_EMOTIONS with 10 entries', () => {
    expect(REQUIRED_EMOTIONS).toHaveLength(10);
  });
});
