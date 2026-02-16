/**
 * SVG emotion generator using LLM
 * Generates a complete set of 10 emotion SVGs for a glint style
 *
 * Supports multiple backends:
 *   - claude  : Claude Code CLI (`claude -p`)
 *   - codex   : OpenAI Codex CLI (`codex exec`)
 *   - opencode: OpenCode CLI (`opencode run`)
 *   - api     : Direct Anthropic API (requires ANTHROPIC_API_KEY)
 *
 * Auto-detects installed CLIs; falls back to API.
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { REQUIRED_EMOTIONS } from './validate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StylePrompt {
  name: string;
  description: string;
  aesthetic: string;
}

export type ProviderName = 'claude' | 'codex' | 'opencode' | 'api';

interface LLMProvider {
  name: ProviderName;
  available(): boolean;
  generate(system: string, user: string): Promise<string>;
}

// ---------------------------------------------------------------------------
// Shared prompt
// ---------------------------------------------------------------------------

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

function buildUserPrompt(prompt: StylePrompt): string {
  return `Generate all 10 emotion SVGs for a style called "${prompt.name}".

Description: ${prompt.description}
Aesthetic: ${prompt.aesthetic}
Background color: #111

Emotions to generate: ${REQUIRED_EMOTIONS.join(', ')}

Return a JSON object with all 10 emotions as keys and complete SVG strings as values. ONLY output the JSON, nothing else.`;
}

// JSON schema for structured output (used by claude and codex)
const SVG_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(
    REQUIRED_EMOTIONS.map((e) => [e, { type: 'string', description: `SVG markup for ${e} emotion` }])
  ),
  required: [...REQUIRED_EMOTIONS],
  additionalProperties: false,
};

// ---------------------------------------------------------------------------
// Utility: check if a binary is on PATH
// ---------------------------------------------------------------------------

function whichSync(bin: string): boolean {
  try {
    execSync(`which ${bin}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Utility: extract JSON from LLM text (handles code fences)
// ---------------------------------------------------------------------------

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : text.trim();
}

// ---------------------------------------------------------------------------
// Provider: Claude Code CLI
// ---------------------------------------------------------------------------

const claudeProvider: LLMProvider = {
  name: 'claude',
  available: () => whichSync('claude'),
  async generate(system, user) {
    // Write schema to temp file for --json-schema
    const schemaPath = join(tmpdir(), `glint-schema-${Date.now()}.json`);
    writeFileSync(schemaPath, JSON.stringify(SVG_SCHEMA));

    const combinedPrompt = `${system}\n\n${user}`;
    // claude -p outputs to stdout; --output-format json --json-schema gives structured_output
    const result = execSync(
      `claude -p ${shellEscape(combinedPrompt)} --output-format json --json-schema ${shellEscape(schemaPath)}`,
      { encoding: 'utf-8', maxBuffer: 1024 * 1024, timeout: 120_000 }
    );

    // Response is JSON with a structured_output field
    const parsed = JSON.parse(result);
    if (parsed.structured_output) {
      return JSON.stringify(parsed.structured_output);
    }
    // Fallback: result field contains text
    return parsed.result || result;
  },
};

// ---------------------------------------------------------------------------
// Provider: OpenAI Codex CLI
// ---------------------------------------------------------------------------

const codexProvider: LLMProvider = {
  name: 'codex',
  available: () => whichSync('codex'),
  async generate(system, user) {
    const schemaPath = join(tmpdir(), `glint-schema-${Date.now()}.json`);
    writeFileSync(schemaPath, JSON.stringify(SVG_SCHEMA));

    const combinedPrompt = `${system}\n\n${user}`;
    const result = execSync(
      `codex exec ${shellEscape(combinedPrompt)} --output-schema ${shellEscape(schemaPath)}`,
      { encoding: 'utf-8', maxBuffer: 1024 * 1024, timeout: 120_000 }
    );

    return result;
  },
};

// ---------------------------------------------------------------------------
// Provider: OpenCode CLI
// ---------------------------------------------------------------------------

const opencodeProvider: LLMProvider = {
  name: 'opencode',
  available: () => whichSync('opencode'),
  async generate(system, user) {
    const combinedPrompt = `${system}\n\n${user}`;
    const result = execSync(
      `opencode run ${shellEscape(combinedPrompt)}`,
      { encoding: 'utf-8', maxBuffer: 1024 * 1024, timeout: 120_000 }
    );

    return result;
  },
};

// ---------------------------------------------------------------------------
// Provider: Direct Anthropic API
// ---------------------------------------------------------------------------

const apiProvider: LLMProvider = {
  name: 'api',
  available: () => !!process.env.ANTHROPIC_API_KEY,
  async generate(system, user) {
    const apiKey = process.env.ANTHROPIC_API_KEY!;

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
        messages: [{ role: 'user', content: user }],
        system,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error: ${res.status} ${err}`);
    }

    const data = (await res.json()) as any;
    return data.content[0].text;
  },
};

// ---------------------------------------------------------------------------
// Provider registry & auto-detection
// ---------------------------------------------------------------------------

const ALL_PROVIDERS: LLMProvider[] = [claudeProvider, codexProvider, opencodeProvider, apiProvider];

function detectProvider(preferred?: string): LLMProvider {
  if (preferred) {
    const p = ALL_PROVIDERS.find((p) => p.name === preferred);
    if (!p) throw new Error(`Unknown provider: ${preferred}. Use: claude, codex, opencode, api`);
    if (!p.available()) {
      throw new Error(
        `Provider "${preferred}" is not available. ` +
          (preferred === 'api'
            ? 'Set ANTHROPIC_API_KEY environment variable.'
            : `Install the ${preferred} CLI or ensure it's on your PATH.`)
      );
    }
    return p;
  }

  // Auto-detect: prefer local CLIs over API
  for (const p of ALL_PROVIDERS) {
    if (p.available()) return p;
  }

  throw new Error(
    'No LLM provider available.\n' +
      'Install one of: claude (Claude Code), codex (OpenAI Codex), opencode (OpenCode)\n' +
      'Or set ANTHROPIC_API_KEY for direct API access.'
  );
}

// ---------------------------------------------------------------------------
// Shell escape helper
// ---------------------------------------------------------------------------

function shellEscape(s: string): string {
  // Use single quotes, escaping any embedded single quotes
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function generateSvgStyle(
  prompt: StylePrompt,
  preferredProvider?: string
): Promise<Record<string, string>> {
  const provider = detectProvider(preferredProvider);
  console.log(`Using provider: ${provider.name}`);

  const system = SYSTEM_PROMPT;
  const user = buildUserPrompt(prompt);

  const rawOutput = await provider.generate(system, user);
  const jsonStr = extractJson(rawOutput);
  const svgs = JSON.parse(jsonStr) as Record<string, string>;

  // Validate we got all emotions
  const missing = REQUIRED_EMOTIONS.filter((e) => !svgs[e]);
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

// ---------------------------------------------------------------------------
// Style presets
// ---------------------------------------------------------------------------

export const STYLE_PRESETS: Record<string, StylePrompt> = {
  cyberpunk: {
    name: 'cyberpunk',
    description: 'Neon-lit cyberpunk eyes with glowing effects',
    aesthetic: 'cyberpunk neon with bright colors (#0ff, #f0f, #ff0), glowing effects, tech feel, angular shapes',
  },
  retro: {
    name: 'retro',
    description: 'Retro 8-bit style blocky eyes',
    aesthetic: 'retro 8-bit pixel art, blocky shapes, limited color palette (green phosphor #33ff33 on dark), CRT monitor feel',
  },
  spooky: {
    name: 'spooky',
    description: 'Halloween-themed creepy eyes',
    aesthetic: 'halloween spooky, glowing orange/green eyes, dark purple accents, jack-o-lantern inspired, eerie feel',
  },
  nature: {
    name: 'nature',
    description: 'Organic nature-inspired eyes with earthy tones',
    aesthetic: 'organic nature theme, earthy greens and browns, leaf/petal shapes, warm and gentle, forest creature eyes',
  },
  robot: {
    name: 'robot',
    description: 'Mechanical robot eyes with LED displays',
    aesthetic: 'mechanical robot, LED-style eyes with scan lines, metallic grays and blues, digital readout feel, HUD elements',
  },
};
