import { renderEmotion } from './renderer';
import { getEmotion } from './emotions';
import { frameToPngBase64 } from './push';
import { writeFileSync } from 'fs';

async function test() {
  const emotion = getEmotion('happy');
  console.log('Emotion config:', emotion);
  
  const frames = await renderEmotion(emotion);
  console.log(`Rendered ${frames.length} frames`);
  
  if (frames.length > 0) {
    console.log('Frame 0 dimensions:', frames[0].width, 'x', frames[0].height);
    console.log('Frame 0 data length:', frames[0].data.length);
    
    // Check if there's any non-black pixels
    let nonBlackPixels = 0;
    for (let i = 0; i < frames[0].data.length; i += 4) {
      const r = frames[0].data[i];
      const g = frames[0].data[i + 1];
      const b = frames[0].data[i + 2];
      if (r > 0 || g > 0 || b > 0) {
        nonBlackPixels++;
      }
    }
    console.log('Non-black pixels:', nonBlackPixels, 'out of', frames[0].data.length / 4);
    
    // Save PNG to file for inspection
    const pngBase64 = frameToPngBase64(frames[0]);
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    writeFileSync('/tmp/glint-test.png', pngBuffer);
    console.log('Wrote PNG to /tmp/glint-test.png');
  }
}

test().catch(console.error);
