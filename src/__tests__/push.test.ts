import { describe, it, expect } from 'bun:test';
import { bufferToGifBase64, pngToGifBase64 } from '../push';
import { Canvas, WIDTH, HEIGHT } from '../canvas';
import { PNG } from 'pngjs';

/** Create a solid-color PNG buffer at given dimensions */
function makePng(w: number, h: number, r = 0, g = 0, b = 0): Buffer {
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < w * h * 4; i += 4) {
    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = 255;
  }
  return PNG.sync.write(png);
}

describe('push', () => {
  describe('bufferToGifBase64', () => {
    it('returns a base64 string', () => {
      const canvas = new Canvas();
      canvas.fillRect(0, 0, 10, 10, 255, 0, 0);
      const result = bufferToGifBase64(canvas.toBuffer());
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('output decodes to valid GIF', () => {
      const canvas = new Canvas();
      const b64 = bufferToGifBase64(canvas.toBuffer());
      const buf = Buffer.from(b64, 'base64');
      // GIF magic bytes: GIF89a
      expect(buf[0]).toBe(0x47); // G
      expect(buf[1]).toBe(0x49); // I
      expect(buf[2]).toBe(0x46); // F
    });

    it('GIF has correct dimensions', () => {
      const canvas = new Canvas();
      const b64 = bufferToGifBase64(canvas.toBuffer());
      const buf = Buffer.from(b64, 'base64');
      const width = buf[6] | (buf[7] << 8);
      const height = buf[8] | (buf[9] << 8);
      expect(width).toBe(WIDTH);
      expect(height).toBe(HEIGHT);
    });
  });

  describe('pngToGifBase64', () => {
    it('converts a PNG buffer to GIF base64', async () => {
      const pngBuffer = makePng(WIDTH, HEIGHT);
      const result = await pngToGifBase64(pngBuffer);
      expect(typeof result).toBe('string');
      const buf = Buffer.from(result, 'base64');
      expect(buf[0]).toBe(0x47); // G
    });

    it('adds text label when provided', async () => {
      const pngBuffer = makePng(WIDTH, HEIGHT);
      const withLabel = await pngToGifBase64(pngBuffer, 'happy');
      const withoutLabel = await pngToGifBase64(pngBuffer);
      expect(withLabel).not.toBe(withoutLabel);
    });

    it('throws on wrong-size image', async () => {
      const pngBuffer = makePng(100, 100);
      expect(pngToGifBase64(pngBuffer)).rejects.toThrow();
    });
  });

  describe('pushToTidbyt', () => {
    it('is a function', async () => {
      const { pushToTidbyt } = await import('../push');
      expect(typeof pushToTidbyt).toBe('function');
    });
  });
});
