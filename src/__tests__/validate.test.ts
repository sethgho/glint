import { describe, it, expect } from 'bun:test';
import { validateStyleDirectory, REQUIRED_EMOTIONS } from '../validate';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '../../assets');

describe('validate', () => {
  it('validates kawaii as valid', async () => {
    const result = await validateStyleDirectory(join(ASSETS_DIR, 'kawaii'));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates kawaii-animated as valid', async () => {
    const result = await validateStyleDirectory(join(ASSETS_DIR, 'kawaii-animated'));
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
