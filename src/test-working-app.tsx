import { render, loadBuiltinFonts } from 'typlit';
import App from './app-test';

async function test() {
  await loadBuiltinFonts();
  
  const frames = await render(<App />);
  console.log(`Rendered ${frames.length} frames`);
  console.log('Frame dimensions:', frames[0].width, 'x', frames[0].height);
  
  // Count non-black pixels
  let nonBlackPixels = 0;
  for (let i = 0; i < frames[0].data.length; i += 4) {
    const r = frames[0].data[i];
    const g = frames[0].data[i + 1];
    const b = frames[0].data[i + 2];
    if (r > 0 || g > 0 || b > 0) {
      nonBlackPixels++;
    }
  }
  console.log('Non-black pixels:', nonBlackPixels);
}

test().catch(console.error);
