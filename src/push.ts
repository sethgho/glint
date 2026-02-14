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
export async function pngToGifBase64(pngBuffer: Buffer, label?: string): Promise<string> {
  let image = sharp(pngBuffer);
  
  // Add text label if provided
  if (label) {
    // Create SVG text overlay - tiny font for 64x32 display
    const svgText = `
      <svg width="${WIDTH}" height="${HEIGHT}">
        <style>
          .label { 
            fill: white; 
            font-size: 8px; 
            font-family: Arial, sans-serif;
            font-weight: bold;
          }
        </style>
        <text x="50%" y="${HEIGHT - 2}" text-anchor="middle" class="label">${label}</text>
      </svg>
    `;
    
    image = image.composite([{
      input: Buffer.from(svgText),
      top: 0,
      left: 0,
    }]);
  }
  
  // Extract raw RGBA pixels from PNG
  const { data, info } = await image
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
