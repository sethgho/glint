/**
 * Configuration loader for glint
 * Reads defaults from ~/.config/glint/config.json
 * Priority: CLI flags → config file → env vars → built-in defaults
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface GenerateConfig {
  provider?: string;
  model?: string;
  description?: string;
  aesthetic?: string;
  promptTemplate?: string;
}

export interface GlintConfig {
  token?: string;
  deviceId?: string;
  style?: string;
  installationId?: string;
  generate?: GenerateConfig;
}

const CONFIG_DIR = join(homedir(), '.config', 'glint');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

let _cached: GlintConfig | null = null;

export function loadConfig(): GlintConfig {
  if (_cached) return _cached;

  if (!existsSync(CONFIG_FILE)) {
    _cached = {};
    return _cached;
  }

  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    _cached = JSON.parse(raw) as GlintConfig;
    return _cached;
  } catch (err) {
    console.warn(`Warning: could not parse ${CONFIG_FILE}, using defaults`);
    _cached = {};
    return _cached;
  }
}

/**
 * Resolve a value with priority: explicit → config → env → fallback
 */
export function resolve(
  explicit: string | undefined,
  configKey: keyof GlintConfig,
  envVar?: string,
  fallback?: string,
): string | undefined {
  if (explicit) return explicit;
  const cfg = loadConfig();
  const fromConfig = cfg[configKey] as string | undefined;
  if (fromConfig) return fromConfig;
  if (envVar && process.env[envVar]) return process.env[envVar];
  return fallback;
}

/**
 * Resolve a generate-specific config value
 * Priority: explicit → config.generate[key] → env → fallback
 */
export function resolveGenerate(
  explicit: string | undefined,
  key: keyof GenerateConfig,
  envVar?: string,
  fallback?: string,
): string | undefined {
  if (explicit) return explicit;
  const cfg = loadConfig();
  const val = cfg.generate?.[key] as string | undefined;
  if (val) return val;
  if (envVar && process.env[envVar]) return process.env[envVar];
  return fallback;
}
