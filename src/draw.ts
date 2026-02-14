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
  const browGap = 2; // gap between eyebrow and eye
  
  // Positioning - center the eyes on the display
  const leftEyeX = 16;  // center of left eye
  const rightEyeX = 48; // center of right eye
  const eyeCenterY = HEIGHT / 2 + 2; // slightly below center to leave room for brows
  
  // Calculate eyebrow Y based on eye position and height
  const browY = Math.round(eyeCenterY - eyeHeight / 2 - browGap - browHeight);
  
  // Draw left eye and eyebrow
  canvas.drawEyebrow(leftEyeX, browY, browWidth, browHeight);
  canvas.drawEye(leftEyeX, eyeCenterY, eyeWidth, eyeHeight, pupilSize);
  
  // Draw right eye and eyebrow
  canvas.drawEyebrow(rightEyeX, browY, browWidth, browHeight);
  canvas.drawEye(rightEyeX, eyeCenterY, eyeWidth, eyeHeight, pupilSize);
  
  return canvas;
}
