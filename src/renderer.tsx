import { render, loadBuiltinFonts, Box, Root } from 'typlit';
import type { EmotionConfig } from './emotions';

export async function renderEmotion(
  emotion: EmotionConfig
): Promise<any[]> {
  await loadBuiltinFonts();

  const App = () => {
    // Use absolute positioning for precise control
    const eyeWidth = 20;
    const eyeHeight = Math.max(12, Math.round(16 * emotion.eyeOpenness));
    const pupilSize = Math.max(5, Math.round(8 * emotion.pupilSize));
    
    // Eyebrow dimensions
    const browWidth = 22;
    const browHeight = 3;
    
    // Positioning
    const leftEyeX = 8;
    const rightEyeX = 36;
    const eyeY = 12;
    const browY = 7;

    return (
      <Root>
        <Box color="#000000" width={64} height={32}>
          {/* Left eyebrow */}
          <Box x={leftEyeX - 1} y={browY} width={browWidth} height={browHeight} color="#FFFFFF" />
          
          {/* Left eye */}
          <Box x={leftEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} color="#FFFFFF">
            <Box 
              x={(eyeWidth - pupilSize) / 2} 
              y={(eyeHeight - pupilSize) / 2}
              width={pupilSize} 
              height={pupilSize} 
              color="#000000" 
            />
          </Box>
          
          {/* Right eyebrow */}
          <Box x={rightEyeX - 1} y={browY} width={browWidth} height={browHeight} color="#FFFFFF" />
          
          {/* Right eye */}
          <Box x={rightEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} color="#FFFFFF">
            <Box 
              x={(eyeWidth - pupilSize) / 2} 
              y={(eyeHeight - pupilSize) / 2}
              width={pupilSize} 
              height={pupilSize} 
              color="#000000" 
            />
          </Box>
        </Box>
      </Root>
    );
  };

  return await render(<App />);
}
