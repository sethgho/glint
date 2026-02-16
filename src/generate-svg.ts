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

import { execSync, spawn } from 'child_process';
import { writeFileSync, mkdtempSync } from 'fs';
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
- IMPORTANT: Keep ALL elements within a safe zone — no element should extend above y=3 or below y=29. This prevents clipping on small displays.

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
// Utility: spawn a CLI process with progress dots and proper timeout
// ---------------------------------------------------------------------------

function spawnWithProgress(
  cmd: string,
  args: string[],
  opts: { timeoutMs?: number; label?: string; pty?: boolean } = {}
): Promise<string> {
  const { timeoutMs = 300_000, label = cmd, pty = false } = opts;

  return new Promise((resolve, reject) => {
    // Some CLIs (claude) require a TTY. Use `script` to fake one.
    let spawnCmd = cmd;
    let spawnArgs = args;
    if (pty) {
      // `script -qc` runs a command in a PTY, outputs to /dev/null for the typescript
      const fullCmd = [cmd, ...args].map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ');
      spawnCmd = 'script';
      spawnArgs = ['-qc', fullCmd, '/dev/null'];
    }

    const proc = spawn(spawnCmd, spawnArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';
    let dots = 0;

    // Spinner frames for visual feedback
    const spinChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const progress = setInterval(() => {
      dots++;
      const spin = spinChars[dots % spinChars.length];
      process.stderr.write(`\r  ${spin} [${label}] generating... ${dots}s`);
    }, 1000);

    const timer = setTimeout(() => {
      clearInterval(progress);
      proc.kill('SIGKILL');
      reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      clearInterval(progress);
      clearTimeout(timer);
      process.stderr.write('\n');

      if (code !== 0) {
        reject(new Error(`${label} exited with code ${code}: ${stderr.slice(0, 500)}`));
      } else {
        resolve(stdout);
      }
    });

    proc.on('error', (err) => {
      clearInterval(progress);
      clearTimeout(timer);
      reject(err);
    });
  });
}

// ---------------------------------------------------------------------------
// Utility: extract JSON from LLM text (handles code fences)
// ---------------------------------------------------------------------------

function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b\[[\?]?[0-9;]*[a-zA-Z]/g, '');
}

function extractJson(text: string): string {
  const clean = stripAnsi(text);
  const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Try to find a JSON object directly
  const jsonMatch = clean.match(/(\{[\s\S]*\})/);
  return jsonMatch ? jsonMatch[1].trim() : clean.trim();
}

// ---------------------------------------------------------------------------
// Provider: Claude Code CLI
// ---------------------------------------------------------------------------

const claudeProvider: LLMProvider = {
  name: 'claude',
  available: () => whichSync('claude'),
  async generate(system, user) {
    const combinedPrompt = `${system}\n\n${user}`;
    console.log('  Calling claude -p (this may take 1-3 minutes)...');

    const result = await spawnWithProgress('claude', [
      '-p', combinedPrompt,
      '--output-format', 'text',
    ], { label: 'claude', timeoutMs: 600_000, pty: true });

    return stripAnsi(result);
  },
};

// ---------------------------------------------------------------------------
// Provider: OpenAI Codex CLI
// ---------------------------------------------------------------------------

const codexProvider: LLMProvider = {
  name: 'codex',
  available: () => whichSync('codex'),
  async generate(system, user) {
    const schemaPath = join(mkdtempSync(join(tmpdir(), 'glint-')), 'schema.json');
    writeFileSync(schemaPath, JSON.stringify(SVG_SCHEMA));

    const combinedPrompt = `${system}\n\n${user}`;
    console.log('  Calling codex exec (this may take 1-3 minutes)...');

    const result = await spawnWithProgress('codex', [
      'exec', combinedPrompt,
      '--output-schema', schemaPath,
    ], { label: 'codex', timeoutMs: 600_000 });

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
    console.log('  Calling opencode run (this may take 1-3 minutes)...');

    const result = await spawnWithProgress('opencode', [
      'run', combinedPrompt,
    ], { label: 'opencode', timeoutMs: 600_000 });

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
      const hints: Record<string, string> = {
        claude: 'Install: npm install -g @anthropic-ai/claude-code',
        codex: 'Install: npm install -g @openai/codex',
        opencode: 'Install: go install github.com/sst/opencode@latest',
        api: 'Set ANTHROPIC_API_KEY environment variable.',
      };
      throw new Error(
        `Provider "${preferred}" is not available. ${hints[preferred] || `Ensure ${preferred} is on your PATH.`}`
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
