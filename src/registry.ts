/**
 * Glint Community Registry client
 * Handles auth, publish, install, search against the community server
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { createHash } from 'crypto';
import { USER_STYLES_DIR } from './styles';

const CONFIG_DIR = join(homedir(), '.config', 'glint');
const AUTH_FILE = join(CONFIG_DIR, 'auth.json');
const DEFAULT_REGISTRY = 'https://glint.sethgholson.com';

export function getRegistryUrl(): string {
  return process.env.GLINT_REGISTRY || DEFAULT_REGISTRY;
}

// --- Auth ---

interface AuthConfig {
  token: string;
  username: string;
  registry: string;
}

export function loadAuth(): AuthConfig | null {
  if (!existsSync(AUTH_FILE)) return null;
  try {
    return JSON.parse(readFileSync(AUTH_FILE, 'utf-8'));
  } catch { return null; }
}

export function saveAuth(auth: AuthConfig) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), { mode: 0o600 });
}

export function getToken(): string | null {
  if (process.env.GLINT_TOKEN) return process.env.GLINT_TOKEN;
  const auth = loadAuth();
  return auth?.token || null;
}

export async function login(): Promise<{ username: string }> {
  const registry = getRegistryUrl();

  // Start device flow
  const codeRes = await fetch(`${registry}/api/auth/device/code`, { method: 'POST' });
  if (!codeRes.ok) throw new Error(`Failed to start auth: ${await codeRes.text()}`);
  const codeData = await codeRes.json() as any;

  console.log(`\nOpen this URL in your browser:\n  ${codeData.verification_uri}\n`);
  console.log(`Enter code: ${codeData.user_code}\n`);
  console.log('Waiting for authorization...');

  // Poll for token
  const interval = (codeData.interval || 5) * 1000;
  const deadline = Date.now() + (codeData.expires_in || 900) * 1000;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, interval));

    const tokenRes = await fetch(`${registry}/api/auth/device/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: codeData.device_code }),
    });

    const tokenData = await tokenRes.json() as any;

    if (tokenData.error === 'authorization_pending') continue;
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    if (tokenData.token) {
      saveAuth({ token: tokenData.token, username: tokenData.user.username, registry });
      return { username: tokenData.user.username };
    }
  }

  throw new Error('Authorization timed out');
}

export async function createToken(name: string): Promise<{ token: string; id: string }> {
  const registry = getRegistryUrl();
  const token = getToken();
  if (!token) throw new Error('Not authenticated. Run: glint auth login');

  const res = await fetch(`${registry}/api/auth/tokens`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) throw new Error(`Failed to create token: ${(await res.json() as any).error}`);
  return res.json() as any;
}

export async function whoami(): Promise<{ username: string; display_name: string | null }> {
  const registry = getRegistryUrl();
  const token = getToken();
  if (!token) throw new Error('Not authenticated. Run: glint auth login');

  const res = await fetch(`${registry}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Auth failed: ${(await res.json() as any).error}`);
  return res.json() as any;
}

// --- Styles ---

export async function search(query?: string, author?: string): Promise<any> {
  const registry = getRegistryUrl();
  const params = new URLSearchParams();
  if (query) params.set('search', query);
  if (author) params.set('author', author);

  const res = await fetch(`${registry}/api/styles?${params}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

export async function publish(styleName: string): Promise<any> {
  const registry = getRegistryUrl();
  const token = getToken();
  if (!token) throw new Error('Not authenticated. Run: glint auth login');

  // Find style directory
  const styleDir = join(USER_STYLES_DIR, styleName);
  if (!existsSync(styleDir)) {
    throw new Error(`Style directory not found: ${styleDir}`);
  }

  // Read emotions
  const pngFiles = readdirSync(styleDir).filter(f => f.endsWith('.png'));
  const emotions = pngFiles.map(f => f.replace('.png', ''));

  const REQUIRED = [
    'neutral', 'happy', 'sad', 'angry', 'surprised',
    'worried', 'sleepy', 'excited', 'confused', 'focused',
  ];
  const missing = REQUIRED.filter(e => !emotions.includes(e));
  if (missing.length > 0) {
    throw new Error(`Missing required emotions: ${missing.join(', ')}`);
  }

  // Build manifest
  const files: Record<string, string> = {};
  for (const emotion of emotions) {
    const buf = readFileSync(join(styleDir, `${emotion}.png`));
    files[`${emotion}.png`] = createHash('sha256').update(buf).digest('hex');
  }

  // Check for glint-style.json or create a default manifest
  let manifest: any;
  const manifestPath = join(styleDir, 'glint-style.json');
  if (existsSync(manifestPath)) {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    manifest.files = files;
    manifest.emotions = emotions;
  } else {
    manifest = {
      specVersion: '1.0',
      name: styleName,
      version: '1.0.0',
      description: `${styleName} style`,
      emotions,
      files,
    };
  }

  // Build form data
  const form = new FormData();
  form.append('manifest', JSON.stringify(manifest));

  for (const emotion of emotions) {
    const buf = readFileSync(join(styleDir, `${emotion}.png`));
    form.append(emotion, new Blob([buf], { type: 'image/png' }), `${emotion}.png`);
  }

  // Check for readme
  const readmePath = join(styleDir, 'README.md');
  if (existsSync(readmePath)) {
    form.append('readme', readFileSync(readmePath, 'utf-8'));
  }

  const res = await fetch(`${registry}/api/styles`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json() as any;
    throw new Error(`Publish failed: ${err.error}${err.details ? ' — ' + JSON.stringify(err.details) : ''}`);
  }

  return res.json();
}

export async function install(ref: string): Promise<string> {
  const registry = getRegistryUrl();

  // Parse @author/slug
  const match = ref.match(/^@?([^/]+)\/(.+)$/);
  if (!match) throw new Error(`Invalid style reference: ${ref}. Use @author/name`);
  const [, author, slug] = match;

  // Get download info
  const res = await fetch(`${registry}/api/styles/${author}/${slug}/download`);
  if (!res.ok) throw new Error(`Style not found: @${author}/${slug}`);
  const data = await res.json() as any;

  // Create local style directory
  const installDir = join(USER_STYLES_DIR, slug);
  mkdirSync(installDir, { recursive: true });

  // Download each emotion
  for (const emotion of data.emotions) {
    const imgRes = await fetch(emotion.url);
    if (!imgRes.ok) throw new Error(`Failed to download ${emotion.emotion}`);
    const buf = Buffer.from(await imgRes.arrayBuffer());

    // Verify hash
    const hash = createHash('sha256').update(buf).digest('hex');
    if (emotion.hash && hash !== emotion.hash) {
      throw new Error(`Hash mismatch for ${emotion.emotion}: expected ${emotion.hash}, got ${hash}`);
    }

    writeFileSync(join(installDir, `${emotion.emotion}.png`), buf);
  }

  // Write manifest
  writeFileSync(join(installDir, 'glint-style.json'), JSON.stringify({
    specVersion: '1.0',
    name: slug,
    version: data.version,
    description: data.description,
    author: data.author,
    emotions: data.emotions.map((e: any) => e.emotion),
  }, null, 2));

  return installDir;
}

export async function getStyleInfo(author: string, slug: string): Promise<any> {
  const registry = getRegistryUrl();
  const res = await fetch(`${registry}/api/styles/${author}/${slug}`);
  if (!res.ok) throw new Error(`Style not found: @${author}/${slug}`);
  return res.json();
}
