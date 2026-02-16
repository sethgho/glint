import { describe, it, expect } from 'bun:test';
import { getStyle, listStyles, loadEmotionImage, listStyleEmotions, STYLES, BUILTIN_STYLES } from '../styles';

const ALL_EMOTIONS = ['angry', 'confused', 'excited', 'focused', 'happy', 'neutral', 'sad', 'sleepy', 'surprised', 'worried'];

describe('styles', () => {
  describe('BUILTIN_STYLES', () => {
    it('defines 3 built-in styles', () => {
      expect(Object.keys(BUILTIN_STYLES)).toHaveLength(3);
    });

    it('has default, kawaii, kawaii-animated', () => {
      expect(BUILTIN_STYLES['default']).toBeDefined();
      expect(BUILTIN_STYLES['kawaii']).toBeDefined();
      expect(BUILTIN_STYLES['kawaii-animated']).toBeDefined();
    });

    it('default is programmatic type', () => {
      expect(BUILTIN_STYLES['default'].type).toBe('programmatic');
    });

    it('kawaii is svg type', () => {
      expect(BUILTIN_STYLES['kawaii'].type).toBe('svg');
    });

    it('kawaii-animated is svg type and animated', () => {
      expect(BUILTIN_STYLES['kawaii-animated'].type).toBe('svg');
      expect(BUILTIN_STYLES['kawaii-animated'].animated).toBe(true);
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
      const s = getStyle('kawaii');
      expect(s.name).toBe('kawaii');
      expect(s.type).toBe('svg');
    });

    it('throws on unknown style', () => {
      expect(() => getStyle('nope')).toThrow(/Unknown style/);
    });

    it('error lists available styles', () => {
      expect(() => getStyle('nope')).toThrow(/Available:/);
    });
  });

  describe('listStyles', () => {
    it('returns at least 3 styles (built-in)', () => {
      const styles = listStyles();
      expect(styles.length).toBeGreaterThanOrEqual(3);
      const names = styles.map(s => s.name);
      expect(names).toContain('default');
      expect(names).toContain('kawaii');
    });

    it('built-in styles do not have userStyle flag', () => {
      const styles = listStyles().filter(s => !s.userStyle);
      expect(styles.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('listStyleEmotions', () => {
    it('returns 10 emotions for kawaii', () => {
      const emotions = listStyleEmotions('kawaii');
      expect(emotions).toHaveLength(10);
      for (const e of ALL_EMOTIONS) {
        expect(emotions).toContain(e);
      }
    });

    it('returns 10 emotions for kawaii-animated', () => {
      expect(listStyleEmotions('kawaii-animated')).toHaveLength(10);
    });

    it('returns empty for programmatic style', () => {
      expect(listStyleEmotions('default')).toHaveLength(0);
    });
  });

  describe('loadEmotionImage', () => {
    it('loads kawaii happy as a buffer', async () => {
      const buf = await loadEmotionImage('kawaii', 'happy');
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBeGreaterThan(0);
    });

    it('loads all kawaii emotions', async () => {
      for (const emotion of ALL_EMOTIONS) {
        const buf = await loadEmotionImage('kawaii', emotion);
        expect(buf.length).toBeGreaterThan(0);
      }
    });

    it('loads all kawaii-animated emotions', async () => {
      for (const emotion of ALL_EMOTIONS) {
        const buf = await loadEmotionImage('kawaii-animated', emotion);
        expect(buf.length).toBeGreaterThan(0);
      }
    });

    it('throws for non-image style', async () => {
      expect(loadEmotionImage('default', 'happy')).rejects.toThrow(/not SVG-based/);
    });

    it('throws for missing emotion image', async () => {
      expect(loadEmotionImage('kawaii', 'nonexistent')).rejects.toThrow(/No SVG found/);
    });
  });
});
