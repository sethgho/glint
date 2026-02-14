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
 * Convert PNG buffer to GIF base64 for Tidbyt
 */
export async function pngToGifBase64(pngBuffer: Buffer): Promise<string> {
  // Extract raw RGBA pixels from PNG
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  if (info.width !== WIDTH || info.height !== HEIGHT) {
    throw new Error(`Image must be ${WIDTH}x${HEIGHT}, got ${info.width}x${info.height}`);
  }
  
  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  encoder.setDelay(75);
  encoder.setRepeat(0);
  encoder.start();
  encoder.addFrame(data);
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
