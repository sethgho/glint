import { describe, it, expect } from 'bun:test';
import { Canvas, WIDTH, HEIGHT } from '../canvas';

describe('Canvas', () => {
  describe('constructor', () => {
    it('creates a 64x32 RGBA buffer', () => {
      const c = new Canvas();
      expect(c.data.length).toBe(WIDTH * HEIGHT * 4);
    });

    it('initializes to black with full alpha', () => {
      const c = new Canvas();
      for (let i = 0; i < c.data.length; i += 4) {
        expect(c.data[i]).toBe(0);     // R
        expect(c.data[i + 1]).toBe(0); // G
        expect(c.data[i + 2]).toBe(0); // B
        expect(c.data[i + 3]).toBe(255); // A
      }
    });
  });

  describe('clear', () => {
    it('fills with specified color', () => {
      const c = new Canvas();
      c.clear(128, 64, 32, 200);
      expect(c.data[0]).toBe(128);
      expect(c.data[1]).toBe(64);
      expect(c.data[2]).toBe(32);
      expect(c.data[3]).toBe(200);
    });

    it('clears to black by default', () => {
      const c = new Canvas();
      c.setPixel(0, 0, 255, 255, 255);
      c.clear();
      expect(c.data[0]).toBe(0);
      expect(c.data[3]).toBe(255);
    });
  });

  describe('setPixel', () => {
    it('sets RGBA at correct offset', () => {
      const c = new Canvas();
      c.setPixel(1, 0, 10, 20, 30, 40);
      const idx = 1 * 4;
      expect(c.data[idx]).toBe(10);
      expect(c.data[idx + 1]).toBe(20);
      expect(c.data[idx + 2]).toBe(30);
      expect(c.data[idx + 3]).toBe(40);
    });

    it('defaults alpha to 255', () => {
      const c = new Canvas();
      c.setPixel(0, 0, 1, 2, 3);
      expect(c.data[3]).toBe(255);
    });

    it('ignores out-of-bounds coordinates', () => {
      const c = new Canvas();
      c.setPixel(-1, 0, 255, 0, 0);
      c.setPixel(WIDTH, 0, 255, 0, 0);
      c.setPixel(0, -1, 255, 0, 0);
      c.setPixel(0, HEIGHT, 255, 0, 0);
      // All pixels should still be black
      for (let i = 0; i < c.data.length; i += 4) {
        expect(c.data[i]).toBe(0);
      }
    });

    it('handles last valid pixel', () => {
      const c = new Canvas();
      c.setPixel(WIDTH - 1, HEIGHT - 1, 42, 0, 0);
      const idx = ((HEIGHT - 1) * WIDTH + (WIDTH - 1)) * 4;
      expect(c.data[idx]).toBe(42);
    });
  });

  describe('fillRect', () => {
    it('fills a rectangular region', () => {
      const c = new Canvas();
      c.fillRect(0, 0, 2, 2, 100, 100, 100);
      // Check 4 pixels
      for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const idx = (y * WIDTH + x) * 4;
        expect(c.data[idx]).toBe(100);
      }
      // Pixel outside rect should be black
      const outsideIdx = (0 * WIDTH + 2) * 4;
      expect(c.data[outsideIdx]).toBe(0);
    });

    it('clips at canvas boundaries', () => {
      const c = new Canvas();
      // Shouldn't throw even with overflow
      c.fillRect(WIDTH - 1, HEIGHT - 1, 10, 10, 200, 0, 0);
      const idx = ((HEIGHT - 1) * WIDTH + (WIDTH - 1)) * 4;
      expect(c.data[idx]).toBe(200);
    });
  });

  describe('drawEye', () => {
    it('draws white rectangle with black pupil', () => {
      const c = new Canvas();
      c.drawEye(32, 16, 10, 8, 4);
      // Center should be black (pupil)
      const centerIdx = (16 * WIDTH + 32) * 4;
      expect(c.data[centerIdx]).toBe(0);
      // Edge of eye area should be white
      const edgeX = 32 - 4; // left edge of eye
      const edgeIdx = (16 * WIDTH + edgeX) * 4;
      expect(c.data[edgeIdx]).toBe(255);
    });
  });

  describe('drawEyebrow', () => {
    it('draws white horizontal rectangle', () => {
      const c = new Canvas();
      c.drawEyebrow(32, 5, 10, 2);
      // Should have white pixels at brow position
      const x = Math.round(32 - 10 / 2);
      const idx = (5 * WIDTH + x) * 4;
      expect(c.data[idx]).toBe(255);
    });
  });

  describe('toBuffer', () => {
    it('returns a Buffer of correct length', () => {
      const c = new Canvas();
      const buf = c.toBuffer();
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBe(WIDTH * HEIGHT * 4);
    });
  });

  describe('constants', () => {
    it('WIDTH is 64', () => expect(WIDTH).toBe(64));
    it('HEIGHT is 32', () => expect(HEIGHT).toBe(32));
  });
});
