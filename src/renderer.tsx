import { render, loadBuiltinFonts, Box, Root, Stack } from 'typlit';
import type { EmotionConfig } from './emotions';

/**
 * Renders eyes and eyebrows for a given emotion config
 * Returns PixelBuffer frames suitable for Tidbyt display (64x32)
 */
export async function renderEmotion(
  emotion: EmotionConfig
): Promise<any[]> {
  await loadBuiltinFonts();

  const App = () => (
    <Root>
      <Box width={64} height={32} backgroundColor="#000">
        <Stack>
          {/* Left eye and eyebrow */}
          <Eye
            x={16}
            y={16}
            openness={emotion.eyeOpenness}
            pupilSize={emotion.pupilSize}
          />
          <Eyebrow
            x={16}
            y={16}
            angle={emotion.eyebrowAngle}
            height={emotion.eyebrowHeight}
          />

          {/* Right eye and eyebrow */}
          <Eye
            x={48}
            y={16}
            openness={emotion.eyeOpenness}
            pupilSize={emotion.pupilSize}
          />
          <Eyebrow
            x={48}
            y={16}
            angle={emotion.eyebrowAngle}
            height={emotion.eyebrowHeight}
          />
        </Stack>
      </Box>
    </Root>
  );

  return await render(<App />);
}

interface EyeProps {
  x: number;
  y: number;
  openness: number;
  pupilSize: number;
}

function Eye({ x, y, openness, pupilSize }: EyeProps) {
  const eyeWidth = 8;
  const eyeHeight = Math.round(8 * openness);
  const pupilDiameter = Math.round(4 * pupilSize);

  return (
    <>
      {/* Eye white */}
      <Box
        x={x - eyeWidth / 2}
        y={y - eyeHeight / 2}
        width={eyeWidth}
        height={eyeHeight}
        backgroundColor="#FFF"
      />
      {/* Pupil */}
      <Box
        x={x - pupilDiameter / 2}
        y={y - pupilDiameter / 2}
        width={pupilDiameter}
        height={pupilDiameter}
        backgroundColor="#000"
      />
    </>
  );
}

interface EyebrowProps {
  x: number;
  y: number;
  angle: number;
  height: number;
}

function Eyebrow({ x, y, angle, height }: EyebrowProps) {
  const browWidth = 10;
  const browThickness = 2;
  const verticalOffset = -8 - Math.round(4 * height);

  // For simplicity, we'll draw a horizontal line that shifts position based on angle
  // Negative angle = slanted down (sad), positive = slanted up (surprised/angry)
  const leftOffset = Math.round(angle * 2);
  const rightOffset = -Math.round(angle * 2);

  return (
    <>
      {/* Left part of eyebrow */}
      <Box
        x={x - browWidth / 2}
        y={y + verticalOffset + leftOffset}
        width={browWidth / 2}
        height={browThickness}
        backgroundColor="#FFF"
      />
      {/* Right part of eyebrow */}
      <Box
        x={x}
        y={y + verticalOffset + rightOffset}
        width={browWidth / 2}
        height={browThickness}
        backgroundColor="#FFF"
      />
    </>
  );
}
