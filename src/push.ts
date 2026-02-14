import GIFEncoder from 'gif-encoder-2';

/**
 * Convert PixelBuffer frames to GIF base64
 */
export function framesToGifBase64(frames: any[], delay: number = 75): string {
  if (frames.length === 0) throw new Error('No frames to encode');
  
  const width = frames[0].width;
  const height = frames[0].height;
  
  const encoder = new GIFEncoder(width, height);
  encoder.setDelay(delay);
  encoder.setRepeat(0); // 0 = loop forever
  encoder.start();
  
  for (const frame of frames) {
    encoder.addFrame(Buffer.from(frame.data));
  }
  
  encoder.finish();
  const buf = encoder.out.getData();
  return buf.toString('base64');
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
