import { describe, it, expect } from 'bun:test';
import { drawEmotion } from '../draw';
import { getEmotion, listEmotions } from '../emotions';
import { WIDTH, HEIGHT } from '../canvas';

describe('drawEmotion', () => {
  it('returns a Canvas with correct buffer size', () => {
    const canvas = drawEmotion(getEmotion('neutral'));
    expect(canvas.data.length).toBe(WIDTH * HEIGHT * 4);
  });

  it('renders all emotions without throwing', () => {
    for (const name of listEmotions()) {
      expect(() => drawEmotion(getEmotion(name))).not.toThrow();
    }
  });

  it('produces non-empty output (has white pixels)', () => {
    const canvas = drawEmotion(getEmotion('happy'));
    let hasWhite = false;
    for (let i = 0; i < canvas.data.length; i += 4) {
      if (canvas.data[i] === 255 && canvas.data[i + 1] === 255 && canvas.data[i + 2] === 255) {
        hasWhite = true;
        break;
      }
    }
    expect(hasWhite).toBe(true);
  });

  it('produces different outputs for different emotions', () => {
    const happy = drawEmotion(getEmotion('happy'));
    const angry = drawEmotion(getEmotion('angry'));
    // Compare buffers — they should differ
    let differ = false;
    for (let i = 0; i < happy.data.length; i++) {
      if (happy.data[i] !== angry.data[i]) {
        differ = true;
        break;
      }
    }
    expect(differ).toBe(true);
  });

  it('sleepy eyes are shorter than surprised eyes', () => {
    const sleepy = drawEmotion(getEmotion('sleepy'));
    const surprised = drawEmotion(getEmotion('surprised'));

    // Count white pixels as a proxy for eye height
    const countWhite = (data: Uint8Array) => {
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 255) count++;
      }
      return count;
    };

    expect(countWhite(sleepy.data)).toBeLessThan(countWhite(surprised.data));
  });

  it('toBuffer produces valid Buffer', () => {
    const canvas = drawEmotion(getEmotion('neutral'));
    const buf = canvas.toBuffer();
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBe(WIDTH * HEIGHT * 4);
  });
});
