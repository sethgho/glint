/**
 * Simple 3x5 pixel font for crisp text on LED displays
 * Each character is a 3-wide, 5-tall bitmap
 */

// Font definition: each char is array of 5 rows, each row is 3 bits (as number 0-7)
const FONT_3X5: Record<string, number[]> = {
  'a': [0b010, 0b101, 0b111, 0b101, 0b101],
  'b': [0b110, 0b101, 0b110, 0b101, 0b110],
  'c': [0b011, 0b100, 0b100, 0b100, 0b011],
  'd': [0b110, 0b101, 0b101, 0b101, 0b110],
  'e': [0b111, 0b100, 0b110, 0b100, 0b111],
  'f': [0b111, 0b100, 0b110, 0b100, 0b100],
  'g': [0b011, 0b100, 0b101, 0b101, 0b011],
  'h': [0b101, 0b101, 0b111, 0b101, 0b101],
  'i': [0b111, 0b010, 0b010, 0b010, 0b111],
  'j': [0b001, 0b001, 0b001, 0b101, 0b010],
  'k': [0b101, 0b101, 0b110, 0b101, 0b101],
  'l': [0b100, 0b100, 0b100, 0b100, 0b111],
  'm': [0b101, 0b111, 0b101, 0b101, 0b101],
  'n': [0b101, 0b111, 0b111, 0b101, 0b101],
  'o': [0b010, 0b101, 0b101, 0b101, 0b010],
  'p': [0b110, 0b101, 0b110, 0b100, 0b100],
  'q': [0b010, 0b101, 0b101, 0b110, 0b011],
  'r': [0b110, 0b101, 0b110, 0b101, 0b101],
  's': [0b011, 0b100, 0b010, 0b001, 0b110],
  't': [0b111, 0b010, 0b010, 0b010, 0b010],
  'u': [0b101, 0b101, 0b101, 0b101, 0b011],
  'v': [0b101, 0b101, 0b101, 0b101, 0b010],
  'w': [0b101, 0b101, 0b101, 0b111, 0b101],
  'x': [0b101, 0b101, 0b010, 0b101, 0b101],
  'y': [0b101, 0b101, 0b010, 0b010, 0b010],
  'z': [0b111, 0b001, 0b010, 0b100, 0b111],
  ' ': [0b000, 0b000, 0b000, 0b000, 0b000],
};

const CHAR_WIDTH = 3;
const CHAR_HEIGHT = 5;
const CHAR_SPACING = 1;

/**
 * Render text to a raw RGBA pixel buffer overlay
 * Returns buffer and dimensions
 */
export function renderPixelText(
  text: string,
  color: [number, number, number] = [255, 255, 255]
): { buffer: Buffer; width: number; height: number } {
  const lowerText = text.toLowerCase();
  const textWidth = lowerText.length * (CHAR_WIDTH + CHAR_SPACING) - CHAR_SPACING;
  const textHeight = CHAR_HEIGHT;
  
  // Create RGBA buffer
  const buffer = Buffer.alloc(textWidth * textHeight * 4, 0);
  
  let xOffset = 0;
  for (const char of lowerText) {
    const bitmap = FONT_3X5[char];
    if (!bitmap) {
      xOffset += CHAR_WIDTH + CHAR_SPACING;
      continue;
    }
    
    for (let row = 0; row < CHAR_HEIGHT; row++) {
      const rowBits = bitmap[row];
      for (let col = 0; col < CHAR_WIDTH; col++) {
        // Check if pixel is set (MSB first)
        const bit = (rowBits >> (CHAR_WIDTH - 1 - col)) & 1;
        if (bit) {
          const x = xOffset + col;
          const y = row;
          const idx = (y * textWidth + x) * 4;
          buffer[idx] = color[0];     // R
          buffer[idx + 1] = color[1]; // G
          buffer[idx + 2] = color[2]; // B
          buffer[idx + 3] = 255;      // A
        }
      }
    }
    
    xOffset += CHAR_WIDTH + CHAR_SPACING;
  }
  
  return { buffer, width: textWidth, height: textHeight };
}

/**
 * Get pixel text dimensions
 */
export function getTextWidth(text: string): number {
  return text.length * (CHAR_WIDTH + CHAR_SPACING) - CHAR_SPACING;
}

export { CHAR_HEIGHT };
