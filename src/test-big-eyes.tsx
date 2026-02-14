import { render, loadBuiltinFonts, Box, Root } from 'typlit';
import { writeFileSync } from 'fs';
import GIFEncoder from 'gif-encoder-2';

async function test() {
  await loadBuiltinFonts();
  
  const App = () => (
    <Root>
      <Box color="#000000" width={64} height={32}>
        {/* Left eye - big white rectangle */}
        <Box x={8} y={10} width={20} height={16} color="#FFFFFF">
          <Box x={7} y={5} width={6} height={6} color="#000000" />
        </Box>
        
        {/* Right eye - big white rectangle */}
        <Box x={36} y={10} width={20} height={16} color="#FFFFFF">
          <Box x={7} y={5} width={6} height={6} color="#000000" />
        </Box>
      </Box>
    </Root>
  );
  
  const frames = await render(<App />);
  
  const encoder = new GIFEncoder(64, 32);
  encoder.setDelay(75);
  encoder.setRepeat(0);
  encoder.start();
  encoder.addFrame(Buffer.from(frames[0].data));
  encoder.finish();
  
  const gifBuffer = encoder.out.getData();
  writeFileSync('/tmp/test-big-eyes.gif', gifBuffer);
  console.log('Saved to /tmp/test-big-eyes.gif');
}

test().catch(console.error);
