/**
 * Simple 64x32 pixel canvas for Tidbyt
 * No frameworks, just raw pixel manipulation
 */

export const WIDTH = 64;
export const HEIGHT = 32;

export class Canvas {
  data: Uint8Array;
  
  constructor() {
    // RGBA buffer: 64 * 32 * 4 bytes
    this.data = new Uint8Array(WIDTH * HEIGHT * 4);
    this.clear();
  }
  
  clear(r = 0, g = 0, b = 0, a = 255) {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
    }
  }
  
  setPixel(x: number, y: number, r: number, g: number, b: number, a = 255) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
    const idx = (y * WIDTH + x) * 4;
    this.data[idx] = r;
    this.data[idx + 1] = g;
    this.data[idx + 2] = b;
    this.data[idx + 3] = a;
  }
  
  fillRect(x: number, y: number, w: number, h: number, r: number, g: number, b: number, a = 255) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }
  
  // Draw an eye: white rectangle with black pupil
  drawEye(centerX: number, centerY: number, width: number, height: number, pupilSize: number) {
    // White of eye
    const eyeX = Math.round(centerX - width / 2);
    const eyeY = Math.round(centerY - height / 2);
    this.fillRect(eyeX, eyeY, width, height, 255, 255, 255);
    
    // Black pupil in center
    const pupilX = Math.round(centerX - pupilSize / 2);
    const pupilY = Math.round(centerY - pupilSize / 2);
    this.fillRect(pupilX, pupilY, pupilSize, pupilSize, 0, 0, 0);
  }
  
  // Draw eyebrow: horizontal white rectangle
  drawEyebrow(centerX: number, y: number, width: number, height: number) {
    const x = Math.round(centerX - width / 2);
    this.fillRect(x, y, width, height, 255, 255, 255);
  }
  
  toBuffer(): Buffer {
    return Buffer.from(this.data);
  }
}
