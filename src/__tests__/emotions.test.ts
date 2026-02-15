import { describe, it, expect } from 'bun:test';
import { getEmotion, listEmotions, EMOTIONS, type EmotionConfig } from '../emotions';

const ALL_EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'worried', 'sleepy', 'excited', 'confused', 'focused'];

describe('emotions', () => {
  describe('EMOTIONS', () => {
    it('defines exactly 10 emotions', () => {
      expect(Object.keys(EMOTIONS)).toHaveLength(10);
    });

    it.each(ALL_EMOTIONS)('has "%s" emotion', (name) => {
      expect(EMOTIONS[name]).toBeDefined();
    });

    it('all emotions have valid parameter ranges', () => {
      for (const [name, e] of Object.entries(EMOTIONS)) {
        expect(e.name).toBe(name);
        expect(e.eyeOpenness).toBeGreaterThanOrEqual(0);
        expect(e.eyeOpenness).toBeLessThanOrEqual(1);
        expect(e.eyebrowAngle).toBeGreaterThanOrEqual(-1);
        expect(e.eyebrowAngle).toBeLessThanOrEqual(1);
        expect(e.eyebrowHeight).toBeGreaterThanOrEqual(0);
        expect(e.eyebrowHeight).toBeLessThanOrEqual(1);
        expect(e.pupilSize).toBeGreaterThanOrEqual(0);
        expect(e.pupilSize).toBeLessThanOrEqual(1);
      }
    });

    it('surprised has maximum eye openness', () => {
      expect(EMOTIONS.surprised.eyeOpenness).toBe(1.0);
    });

    it('sleepy has minimum eye openness', () => {
      expect(EMOTIONS.sleepy.eyeOpenness).toBe(0.3);
    });

    it('angry has negative eyebrow angle (furrowed)', () => {
      expect(EMOTIONS.angry.eyebrowAngle).toBeLessThan(0);
    });

    it('surprised has positive eyebrow angle (raised)', () => {
      expect(EMOTIONS.surprised.eyebrowAngle).toBeGreaterThan(0);
    });
  });

  describe('getEmotion', () => {
    it('returns emotion config by name', () => {
      const e = getEmotion('happy');
      expect(e.name).toBe('happy');
      expect(e.eyeOpenness).toBeDefined();
    });

    it('is case-insensitive', () => {
      expect(getEmotion('HAPPY').name).toBe('happy');
      expect(getEmotion('Happy').name).toBe('happy');
    });

    it('throws on unknown emotion', () => {
      expect(() => getEmotion('ecstatic')).toThrow(/Unknown emotion/);
    });

    it('error message lists available emotions', () => {
      expect(() => getEmotion('nope')).toThrow(/Available:/);
    });
  });

  describe('listEmotions', () => {
    it('returns all emotion names', () => {
      const list = listEmotions();
      expect(list).toHaveLength(10);
      for (const name of ALL_EMOTIONS) {
        expect(list).toContain(name);
      }
    });

    it('returns strings', () => {
      for (const name of listEmotions()) {
        expect(typeof name).toBe('string');
      }
    });
  });
});
