import { render, loadBuiltinFonts, Box, Root, Column, Text } from 'typlit';

async function test() {
  await loadBuiltinFonts();
  
  const App = () => (
    <Root delay={100}>
      <Box color="#0a0a0a" padding={2}>
        <Column expanded mainAlign="space_evenly" crossAlign="center">
          <Text content="HELLO" color="#7CFFFF" font="6x13" />
        </Column>
      </Box>
    </Root>
  );
  
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
