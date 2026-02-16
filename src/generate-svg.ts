/**
 * SVG emotion generator using LLM
 * Generates a complete set of 10 emotion SVGs for a glint style
 */

import { REQUIRED_EMOTIONS } from './validate';

interface StylePrompt {
  name: string;
  description: string;
  aesthetic: string; // e.g. "kawaii anime", "cyberpunk neon", "retro pixel"
}

const SYSTEM_PROMPT = `You are an SVG artist for "glint" — an app that shows expressive eyes on small displays.

RULES:
- Output ONLY valid SVG, no explanation
- viewBox="0 0 64 32", width="64", height="32"
- Dark background (use the provided bg color)
- Eyes should be the main feature, with optional mouth/eyebrows for expression
- Keep SVGs clean and small (<2KB each)
- Use the aesthetic style described
- Each emotion must be visually distinct and recognizable even at tiny sizes
- No text elements except small symbols (like "z" for sleepy or "?" for confused)

Output format: Return a JSON object where keys are emotion names and values are complete SVG strings.
Example: {"happy": "<svg ...>...</svg>", "sad": "<svg ...>...</svg>"}`;

export async function generateSvgStyle(prompt: StylePrompt): Promise<Record<string, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable required for SVG generation');
  }

  const userPrompt = `Generate all 10 emotion SVGs for a style called "${prompt.name}".

Description: ${prompt.description}
Aesthetic: ${prompt.aesthetic}
Background color: #111

Emotions to generate: ${REQUIRED_EMOTIONS.join(', ')}

Return a JSON object with all 10 emotions as keys and complete SVG strings as values. ONLY output the JSON, nothing else.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 8192,
      messages: [
        { role: 'user', content: userPrompt },
      ],
      system: SYSTEM_PROMPT,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${err}`);
  }

  const data = await res.json() as any;
  const text = data.content[0].text;

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const svgs = JSON.parse(jsonStr) as Record<string, string>;

  // Validate we got all emotions
  const missing = REQUIRED_EMOTIONS.filter(e => !svgs[e]);
  if (missing.length > 0) {
    throw new Error(`LLM didn't generate all emotions. Missing: ${missing.join(', ')}`);
  }

  // Basic SVG validation
  for (const [emotion, svg] of Object.entries(svgs)) {
    if (!svg.includes('<svg') || !svg.includes('</svg>')) {
      throw new Error(`Invalid SVG for ${emotion}`);
    }
  }

  return svgs;
}

// Style presets for quick generation
export const STYLE_PRESETS: Record<string, StylePrompt> = {
  'cyberpunk': {
    name: 'cyberpunk',
    description: 'Neon-lit cyberpunk eyes with glowing effects',
    aesthetic: 'cyberpunk neon with bright colors (#0ff, #f0f, #ff0), glowing effects, tech feel, angular shapes',
  },
  'retro': {
    name: 'retro',
    description: 'Retro 8-bit style blocky eyes',
    aesthetic: 'retro 8-bit pixel art, blocky shapes, limited color palette (green phosphor #33ff33 on dark), CRT monitor feel',
  },
  'spooky': {
    name: 'spooky',
    description: 'Halloween-themed creepy eyes',
    aesthetic: 'halloween spooky, glowing orange/green eyes, dark purple accents, jack-o-lantern inspired, eerie feel',
  },
  'nature': {
    name: 'nature',
    description: 'Organic nature-inspired eyes with earthy tones',
    aesthetic: 'organic nature theme, earthy greens and browns, leaf/petal shapes, warm and gentle, forest creature eyes',
  },
  'robot': {
    name: 'robot',
    description: 'Mechanical robot eyes with LED displays',
    aesthetic: 'mechanical robot, LED-style eyes with scan lines, metallic grays and blues, digital readout feel, HUD elements',
  },
};
