/**
 * Emotion definitions for glint
 * Each emotion maps to specific eye and eyebrow configurations
 */

export interface EmotionConfig {
  name: string;
  eyeOpenness: number; // 0-1, 0 = closed, 1 = fully open
  eyebrowAngle: number; // -1 to 1, -1 = sad/worried, 0 = neutral, 1 = surprised/angry
  eyebrowHeight: number; // 0-1, vertical position
  pupilSize: number; // 0-1, size of pupil
}

export const EMOTIONS: Record<string, EmotionConfig> = {
  neutral: {
    name: 'neutral',
    eyeOpenness: 0.7,
    eyebrowAngle: 0,
    eyebrowHeight: 0.5,
    pupilSize: 0.5,
  },
  happy: {
    name: 'happy',
    eyeOpenness: 0.6,
    eyebrowAngle: 0.3,
    eyebrowHeight: 0.6,
    pupilSize: 0.6,
  },
  sad: {
    name: 'sad',
    eyeOpenness: 0.5,
    eyebrowAngle: -0.5,
    eyebrowHeight: 0.4,
    pupilSize: 0.4,
  },
  angry: {
    name: 'angry',
    eyeOpenness: 0.8,
    eyebrowAngle: -0.8,
    eyebrowHeight: 0.3,
    pupilSize: 0.3,
  },
  surprised: {
    name: 'surprised',
    eyeOpenness: 1.0,
    eyebrowAngle: 0.8,
    eyebrowHeight: 0.8,
    pupilSize: 0.7,
  },
  worried: {
    name: 'worried',
    eyeOpenness: 0.6,
    eyebrowAngle: -0.3,
    eyebrowHeight: 0.6,
    pupilSize: 0.5,
  },
  sleepy: {
    name: 'sleepy',
    eyeOpenness: 0.3,
    eyebrowAngle: 0,
    eyebrowHeight: 0.5,
    pupilSize: 0.4,
  },
  excited: {
    name: 'excited',
    eyeOpenness: 0.9,
    eyebrowAngle: 0.5,
    eyebrowHeight: 0.7,
    pupilSize: 0.8,
  },
  confused: {
    name: 'confused',
    eyeOpenness: 0.6,
    eyebrowAngle: 0.2,
    eyebrowHeight: 0.6,
    pupilSize: 0.5,
  },
  focused: {
    name: 'focused',
    eyeOpenness: 0.7,
    eyebrowAngle: -0.2,
    eyebrowHeight: 0.4,
    pupilSize: 0.4,
  },
};

export function getEmotion(name: string): EmotionConfig {
  const emotion = EMOTIONS[name.toLowerCase()];
  if (!emotion) {
    throw new Error(
      `Unknown emotion: ${name}. Available: ${Object.keys(EMOTIONS).join(', ')}`
    );
  }
  return emotion;
}

export function listEmotions(): string[] {
  return Object.keys(EMOTIONS);
}
