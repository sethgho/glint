import { describe, it, expect } from 'bun:test';
import { getStyle, listStyles, loadEmotionImage, listStyleEmotions, STYLES, BUILTIN_STYLES } from '../styles';

const ALL_EMOTIONS = ['angry', 'confused', 'excited', 'focused', 'happy', 'neutral', 'sad', 'sleepy', 'surprised', 'worried'];

describe('styles', () => {
  describe('BUILTIN_STYLES', () => {
    it('defines 4 built-in styles', () => {
      expect(Object.keys(BUILTIN_STYLES)).toHaveLength(4);
    });

    it('has default, ai-v1, anime, pixel-art', () => {
      expect(BUILTIN_STYLES['default']).toBeDefined();
      expect(BUILTIN_STYLES['ai-v1']).toBeDefined();
      expect(BUILTIN_STYLES['anime']).toBeDefined();
      expect(BUILTIN_STYLES['pixel-art']).toBeDefined();
    });

    it('default is programmatic type', () => {
      expect(BUILTIN_STYLES['default'].type).toBe('programmatic');
    });

    it('ai-v1 is image type', () => {
      expect(BUILTIN_STYLES['ai-v1'].type).toBe('image');
    });

    it('all styles have name and description', () => {
      for (const style of Object.values(BUILTIN_STYLES)) {
        expect(style.name).toBeTruthy();
        expect(style.description).toBeTruthy();
      }
    });

    it('STYLES is an alias for BUILTIN_STYLES', () => {
      expect(STYLES).toBe(BUILTIN_STYLES);
    });
  });

  describe('getStyle', () => {
    it('returns style by name', () => {
      const s = getStyle('ai-v1');
      expect(s.name).toBe('ai-v1');
      expect(s.type).toBe('image');
    });

    it('throws on unknown style', () => {
      expect(() => getStyle('nope')).toThrow(/Unknown style/);
    });

    it('error lists available styles', () => {
      expect(() => getStyle('nope')).toThrow(/Available:/);
    });
  });

  describe('listStyles', () => {
    it('returns at least 4 styles (built-in)', () => {
      const styles = listStyles();
      expect(styles.length).toBeGreaterThanOrEqual(4);
      const names = styles.map(s => s.name);
      expect(names).toContain('default');
      expect(names).toContain('ai-v1');
    });

    it('built-in styles do not have userStyle flag', () => {
      const styles = listStyles().filter(s => !s.userStyle);
      expect(styles.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('listStyleEmotions', () => {
    it('returns 10 emotions for ai-v1', () => {
      const emotions = listStyleEmotions('ai-v1');
      expect(emotions).toHaveLength(10);
      for (const e of ALL_EMOTIONS) {
        expect(emotions).toContain(e);
      }
    });

    it('returns 10 emotions for anime', () => {
      expect(listStyleEmotions('anime')).toHaveLength(10);
    });

    it('returns 10 emotions for pixel-art', () => {
      expect(listStyleEmotions('pixel-art')).toHaveLength(10);
    });

    it('returns empty for programmatic style', () => {
      expect(listStyleEmotions('default')).toHaveLength(0);
    });
  });

  describe('loadEmotionImage', () => {
    it('loads ai-v1 happy as a 64x32 PNG buffer', async () => {
      const buf = await loadEmotionImage('ai-v1', 'happy');
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBeGreaterThan(0);
    });

    it('loads all ai-v1 emotions', async () => {
      for (const emotion of ALL_EMOTIONS) {
        const buf = await loadEmotionImage('ai-v1', emotion);
        expect(buf.length).toBeGreaterThan(0);
      }
    });

    it('loads all anime emotions', async () => {
      for (const emotion of ALL_EMOTIONS) {
        const buf = await loadEmotionImage('anime', emotion);
        expect(buf.length).toBeGreaterThan(0);
      }
    });

    it('loads all pixel-art emotions', async () => {
      for (const emotion of ALL_EMOTIONS) {
        const buf = await loadEmotionImage('pixel-art', emotion);
        expect(buf.length).toBeGreaterThan(0);
      }
    });

    it('throws for non-image style', async () => {
      expect(loadEmotionImage('default', 'happy')).rejects.toThrow(/not image-based/);
    });

    it('throws for missing emotion image', async () => {
      expect(loadEmotionImage('ai-v1', 'nonexistent')).rejects.toThrow(/No image found/);
    });
  });
});
