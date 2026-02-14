import { render, loadBuiltinFonts } from 'typlit'
import Main from './simple-app'
import GIFEncoder from 'gif-encoder-2'

function framesToGifBase64(frames: any[], delay: number): string {
  if (frames.length === 0) throw new Error('No frames to encode')
  
  const width = frames[0].width
  const height = frames[0].height
  
  const encoder = new GIFEncoder(width, height)
  encoder.setDelay(delay)
  encoder.setRepeat(0)
  encoder.start()
  
  for (const frame of frames) {
    encoder.addFrame(Buffer.from(frame.data))
  }
  
  encoder.finish()
  const buf = encoder.out.getData()
  return buf.toString('base64')
}

async function main() {
  await loadBuiltinFonts()
  const frames = await render(<Main />)
  
  console.log(`Rendered ${frames.length} frames`)
  
  const imageB64 = framesToGifBase64(frames, 75)

  const token = process.env.TIDBYT_TOKEN
  const deviceID = process.env.TIDBYT_DEVICE_ID

  if (!token || !deviceID) {
    throw new Error('Missing TIDBYT_TOKEN or TIDBYT_DEVICE_ID')
  }

  const res = await fetch(`https://api.tidbyt.com/v0/devices/${encodeURIComponent(deviceID)}/push`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageB64,
      installationID: 'glinttest',
      background: false,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Tidbyt push failed: ${res.status} ${res.statusText} ${text}`)
  }

  console.log('pushed')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
