import GIFEncoder from 'gif-encoder-2';
import sharp from 'sharp';
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
 * Convert PNG buffer(s) to GIF base64 for Tidbyt
 * Supports both single-frame and multi-frame animated GIFs
 */
export async function pngToGifBase64(
  pngBuffers: Buffer | Buffer[], 
  label?: string,
  fps: number = 15
): Promise<string> {
  const bufferArray = Array.isArray(pngBuffers) ? pngBuffers : [pngBuffers];
  const delay = Math.round(1000 / fps); // Convert fps to milliseconds per frame
  
  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  encoder.setDelay(delay);
  encoder.setRepeat(0); // 0 = loop forever
  encoder.start();
  
  for (let i = 0; i < bufferArray.length; i++) {
    let image = sharp(bufferArray[i]);
    
    // Add label to first frame only
    if (label && i === 0) {
      const { renderPixelText, CHAR_HEIGHT } = await import('./pixelfont');
      const { buffer: textBuffer, width: textWidth, height: textHeight } = renderPixelText(label);
      
      // Center text horizontally, place at bottom
      const textX = Math.floor((WIDTH - textWidth) / 2);
      const textY = HEIGHT - CHAR_HEIGHT - 1;
      
      image = image.composite([{
        input: textBuffer,
        raw: {
          width: textWidth,
          height: textHeight,
          channels: 4,
        },
        top: textY,
        left: textX,
      }]);
    }
    
    // Extract raw RGBA pixels from PNG
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    if (info.width !== WIDTH || info.height !== HEIGHT) {
      throw new Error(`Frame ${i}: Image must be ${WIDTH}x${HEIGHT}, got ${info.width}x${info.height}`);
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
