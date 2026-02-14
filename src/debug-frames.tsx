import { render, loadBuiltinFonts } from 'typlit'
import Main from './simple-app'

async function main() {
  await loadBuiltinFonts()
  const frames = await render(<Main />)
  
  console.log(`Rendered ${frames.length} frames`)
  console.log('Frame dimensions:', frames[0].width, 'x', frames[0].height)
  
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
  
  // Sample first 10 pixels
  console.log('\nFirst 10 pixels (RGBA):')
  for (let i = 0; i < 40; i += 4) {
    const r = frames[0].data[i];
    const g = frames[0].data[i + 1];
    const b = frames[0].data[i + 2];
    const a = frames[0].data[i + 3];
    console.log(`  [${r},${g},${b},${a}]`)
  }
}

main().catch(console.error)
