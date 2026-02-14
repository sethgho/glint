/**
 * Draw eyes and eyebrows based on emotion
 */

import { Canvas, WIDTH, HEIGHT } from './canvas';
import type { EmotionConfig } from './emotions';

export function drawEmotion(emotion: EmotionConfig): Canvas {
  const canvas = new Canvas();
  
  // Eye parameters based on emotion
  const eyeWidth = 18;
  const eyeHeight = Math.round(6 + 10 * emotion.eyeOpenness); // 6-16px tall
  const pupilSize = Math.round(3 + 5 * emotion.pupilSize); // 3-8px
  
  // Eyebrow parameters
  const browWidth = 20;
  const browHeight = 2;
  const browGap = 2; // base gap between eyebrow and eye
  
  // Eyebrow vertical offset based on emotion (higher = more surprised/raised)
  const browRaise = Math.round(4 * (emotion.eyebrowHeight - 0.5)); // -2 to +2 pixels
  
  // Positioning - center the eyes on the display
  const leftEyeX = 16;  // center of left eye
  const rightEyeX = 48; // center of right eye
  const eyeCenterY = HEIGHT / 2 + 2; // slightly below center to leave room for brows
  
  // Calculate base eyebrow Y
  const baseBrowY = Math.round(eyeCenterY - eyeHeight / 2 - browGap - browHeight);
  
  // Draw left eye and eyebrow (with angle for expression)
  drawAngledEyebrow(canvas, leftEyeX, baseBrowY - browRaise, browWidth, browHeight, emotion.eyebrowAngle, true);
  canvas.drawEye(leftEyeX, eyeCenterY, eyeWidth, eyeHeight, pupilSize);
  
  // Draw right eye and eyebrow (mirrored angle)
  drawAngledEyebrow(canvas, rightEyeX, baseBrowY - browRaise, browWidth, browHeight, emotion.eyebrowAngle, false);
  canvas.drawEye(rightEyeX, eyeCenterY, eyeWidth, eyeHeight, pupilSize);
  
  return canvas;
}

/**
 * Draw an angled eyebrow for more expression
 * angle: -1 (sad/worried, outer edge down) to +1 (angry, inner edge down)
 * isLeft: true for left eye, false for right
 */
function drawAngledEyebrow(
  canvas: Canvas, 
  centerX: number, 
  baseY: number, 
  width: number, 
  height: number, 
  angle: number,
  isLeft: boolean
) {
  const startX = Math.round(centerX - width / 2);
  const angleOffset = Math.round(angle * 3); // max 3 pixel slope
  
  for (let x = 0; x < width; x++) {
    // Calculate Y offset based on position and angle
    // For left eye: positive angle = inner (right) edge lower
    // For right eye: positive angle = inner (left) edge lower
    const progress = x / (width - 1); // 0 to 1
    let yOffset: number;
    
    if (isLeft) {
      // Left eye: inner edge is on the right
      yOffset = Math.round(angleOffset * (progress - 0.5) * 2);
    } else {
      // Right eye: inner edge is on the left (mirror)
      yOffset = Math.round(angleOffset * (0.5 - progress) * 2);
    }
    
    // Draw a column of pixels for the eyebrow thickness
    for (let h = 0; h < height; h++) {
      canvas.setPixel(startX + x, baseY + yOffset + h, 255, 255, 255);
    }
  }
}
