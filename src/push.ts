import GIFEncoder from 'gif-encoder-2';
import { PNG } from 'pngjs';
import { WIDTH, HEIGHT } from './canvas';

/**
 * Convert RGBA buffer to GIF base64
 */
export function bufferToGifBase64(buffer: Buffer): string {
  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  encoder.setDelay(75);
  encoder.setRepeat(0);
  encoder.start();
  encoder.addFrame(buffer);
  encoder.finish();
  return encoder.out.getData().toString('base64');
}

/**
 * Decode a PNG buffer to raw RGBA pixels
 */
function decodePNG(pngBuffer: Buffer): { data: Buffer; width: number; height: number } {
  const png = PNG.sync.read(pngBuffer);
  return { data: png.data as unknown as Buffer, width: png.width, height: png.height };
}

/**
 * Composite a small RGBA buffer onto a larger one at (left, top)
 */
function compositeRGBA(
  base: Buffer, baseWidth: number,
  overlay: Buffer, overlayWidth: number, overlayHeight: number,
  left: number, top: number
): void {
  for (let y = 0; y < overlayHeight; y++) {
    for (let x = 0; x < overlayWidth; x++) {
      const srcIdx = (y * overlayWidth + x) * 4;
      const alpha = overlay[srcIdx + 3];
      if (alpha === 0) continue;
      const dstX = left + x;
      const dstY = top + y;
      if (dstX < 0 || dstX >= baseWidth || dstY < 0 || dstY >= HEIGHT) continue;
      const dstIdx = (dstY * baseWidth + dstX) * 4;
      if (alpha === 255) {
        base[dstIdx] = overlay[srcIdx];
        base[dstIdx + 1] = overlay[srcIdx + 1];
        base[dstIdx + 2] = overlay[srcIdx + 2];
        base[dstIdx + 3] = 255;
      } else {
        const a = alpha / 255;
        const ia = 1 - a;
        base[dstIdx] = Math.round(overlay[srcIdx] * a + base[dstIdx] * ia);
        base[dstIdx + 1] = Math.round(overlay[srcIdx + 1] * a + base[dstIdx + 1] * ia);
        base[dstIdx + 2] = Math.round(overlay[srcIdx + 2] * a + base[dstIdx + 2] * ia);
        base[dstIdx + 3] = Math.min(255, base[dstIdx + 3] + alpha);
      }
    }
  }
}

/**
 * Convert PNG buffer(s) to GIF base64 for Tidbyt
 * Supports both single-frame and multi-frame animated GIFs
 */
export async function pngToGifBase64(
  pngBuffers: Buffer | Buffer[], 
  label?: string,
  fps: number = 15
): Promise<string> {
  const bufferArray = Array.isArray(pngBuffers) ? pngBuffers : [pngBuffers];
  const delay = Math.round(1000 / fps);
  
  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  encoder.setDelay(delay);
  encoder.setRepeat(0);
  encoder.start();
  
  for (let i = 0; i < bufferArray.length; i++) {
    const { data, width, height } = decodePNG(bufferArray[i]);
    
    if (width !== WIDTH || height !== HEIGHT) {
      throw new Error(`Frame ${i}: Image must be ${WIDTH}x${HEIGHT}, got ${width}x${height}`);
    }

    // Add label to first frame only
    if (label && i === 0) {
      const { renderPixelText, CHAR_HEIGHT } = await import('./pixelfont');
      const { buffer: textBuffer, width: textWidth, height: textHeight } = renderPixelText(label);
      
      const textX = Math.floor((WIDTH - textWidth) / 2);
      const textY = HEIGHT - CHAR_HEIGHT - 1;
      
      compositeRGBA(data, WIDTH, textBuffer, textWidth, textHeight, textX, textY);
    }
    
    encoder.addFrame(data);
  }
  
  encoder.finish();
  return encoder.out.getData().toString('base64');
}

/**
 * Push image to Tidbyt device
 */
export async function pushToTidbyt(
  imageBase64: string,
  options: {
    token: string;
    deviceId: string;
    installationId?: string;
  }
): Promise<void> {
  const { token, deviceId, installationId = 'glint' } = options;

  const res = await fetch(
    `https://api.tidbyt.com/v0/devices/${encodeURIComponent(deviceId)}/push`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        installationID: installationId,
        background: false,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Tidbyt push failed: ${res.status} ${res.statusText} ${text}`);
  }
}
