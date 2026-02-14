import { render, loadBuiltinFonts } from 'typlit'
import Main from './tidbyt-app'

async function main() {
  await loadBuiltinFonts()
  const frames = await render(<Main />)
  
  console.log(`Rendered ${frames.length} frames`)
  
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
  console.log('Non-black pixels:', nonBlackPixels, 'out of', frames[0].data.length / 4);
}

main().catch(console.error)
