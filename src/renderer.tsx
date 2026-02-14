import { render, loadBuiltinFonts, Box, Root, Row, Column } from 'typlit';
import type { EmotionConfig } from './emotions';

export async function renderEmotion(
  emotion: EmotionConfig
): Promise<any[]> {
  await loadBuiltinFonts();

  const App = () => {
    // Calculate eye dimensions based on emotion
    const eyeWidth = 10;
    const eyeHeight = Math.max(3, Math.round(10 * emotion.eyeOpenness));
    const pupilSize = Math.max(2, Math.round(6 * emotion.pupilSize));
    
    // Eyebrow positioning
    const browY = Math.round(4 - (emotion.eyebrowHeight * 2));
    const browWidth = 12;
    const browHeight = 2;

    return (
      <Root>
        <Box color="#000000" padding={2}>
          <Column expanded mainAlign="center" crossAlign="center">
            <Row mainAlign="space_evenly" crossAlign="center">
              {/* Left eye with eyebrow */}
              <Column mainAlign="center" crossAlign="center">
                <Box height={Math.max(0, browY)} />
                <Box width={browWidth} height={browHeight} color="#FFFFFF" />
                <Box height={2} />
                <Box width={eyeWidth} height={eyeHeight} color="#FFFFFF">
                  <Column expanded mainAlign="center" crossAlign="center">
                    <Box width={pupilSize} height={pupilSize} color="#000000" />
                  </Column>
                </Box>
              </Column>

              {/* Right eye with eyebrow */}
              <Column mainAlign="center" crossAlign="center">
                <Box height={Math.max(0, browY)} />
                <Box width={browWidth} height={browHeight} color="#FFFFFF" />
                <Box height={2} />
                <Box width={eyeWidth} height={eyeHeight} color="#FFFFFF">
                  <Column expanded mainAlign="center" crossAlign="center">
                    <Box width={pupilSize} height={pupilSize} color="#000000" />
                  </Column>
                </Box>
              </Column>
            </Row>
          </Column>
        </Box>
      </Root>
    );
  };

  return await render(<App />);
}
