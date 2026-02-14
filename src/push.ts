import { PNG } from 'pngjs';

/**
 * Convert PixelBuffer to PNG base64
 */
export function frameToPngBase64(frame: any): string {
  const png = new PNG({
    width: frame.width,
    height: frame.height,
    colorType: 6, // RGBA
  });

  // Copy RGBA data
  png.data = Buffer.from(frame.data);

  // Pack and encode to base64
  const buffer = PNG.sync.write(png);
  return buffer.toString('base64');
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
        background: false, // Show immediately
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Tidbyt push failed: ${res.status} ${res.statusText} ${text}`
    );
  }
}
