import { describe, it, expect } from 'bun:test';
import { renderPixelText, getTextWidth, CHAR_HEIGHT } from '../pixelfont';

describe('pixelfont', () => {
  describe('CHAR_HEIGHT', () => {
    it('is 5', () => expect(CHAR_HEIGHT).toBe(5));
  });

  describe('getTextWidth', () => {
    it('returns correct width for single char', () => {
      // 3px char + 0 spacing
      expect(getTextWidth('a')).toBe(3);
    });

    it('returns correct width for multi-char', () => {
      // 3 chars * (3px + 1px spacing) - 1px trailing
      expect(getTextWidth('abc')).toBe(11);
    });

    it('returns correct width for space', () => {
      expect(getTextWidth(' ')).toBe(3);
    });
  });

  describe('renderPixelText', () => {
    it('returns buffer with correct dimensions', () => {
      const result = renderPixelText('hi');
      expect(result.width).toBe(getTextWidth('hi'));
      expect(result.height).toBe(CHAR_HEIGHT);
      expect(result.buffer.length).toBe(result.width * result.height * 4);
    });

    it('renders white pixels by default', () => {
      const result = renderPixelText('a');
      let hasWhite = false;
      for (let i = 0; i < result.buffer.length; i += 4) {
        if (result.buffer[i] === 255 && result.buffer[i + 1] === 255 && result.buffer[i + 2] === 255) {
          hasWhite = true;
          break;
        }
      }
      expect(hasWhite).toBe(true);
    });

    it('renders custom color', () => {
      const result = renderPixelText('a', [255, 0, 0]);
      let hasRed = false;
      for (let i = 0; i < result.buffer.length; i += 4) {
        if (result.buffer[i] === 255 && result.buffer[i + 1] === 0 && result.buffer[i + 2] === 0 && result.buffer[i + 3] === 255) {
          hasRed = true;
          break;
        }
      }
      expect(hasRed).toBe(true);
    });

    it('converts to lowercase', () => {
      const upper = renderPixelText('A');
      const lower = renderPixelText('a');
      expect(Buffer.compare(upper.buffer, lower.buffer)).toBe(0);
    });

    it('handles space character', () => {
      const result = renderPixelText(' ');
      // All pixels should be transparent (alpha 0)
      for (let i = 0; i < result.buffer.length; i += 4) {
        expect(result.buffer[i + 3]).toBe(0);
      }
    });

    it('handles unknown characters gracefully', () => {
      // Should not throw, just skip unknown chars
      expect(() => renderPixelText('a1b')).not.toThrow();
    });

    it('different letters produce different output', () => {
      const a = renderPixelText('a');
      const b = renderPixelText('b');
      expect(Buffer.compare(a.buffer, b.buffer)).not.toBe(0);
    });

    it('renders all alphabet letters', () => {
      for (const ch of 'abcdefghijklmnopqrstuvwxyz') {
        expect(() => renderPixelText(ch)).not.toThrow();
      }
    });
  });
});
