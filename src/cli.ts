#!/usr/bin/env node

import { Command } from 'commander';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getEmotion, listEmotions } from './emotions';
import { drawEmotion } from './draw';
import { bufferToGifBase64, pngToGifBase64, pushToTidbyt } from './push';
import { getStyle, listStyles, loadEmotionImage, listStyleEmotions, getStyleDir, USER_STYLES_DIR, getAnimationParams } from './styles';
import { resolve, resolveGenerate, loadConfig } from './config';
import { validateStyleDirectory, REQUIRED_EMOTIONS } from './validate';
import * as registry from './registry';

const program = new Command();

program
  .name('glint')
  .description('Express emotional status on a Tidbyt display via eyes & eyebrows')
  .version('0.3.0');

program
  .command('show')
  .description('Display an emotion on your Tidbyt')
  .argument('<emotion>', 'emotion to display (e.g., happy, sad, angry)')
  .option('-s, --style <style>', 'visual style (default, ai-v1)')
  .option('-t, --token <token>', 'Tidbyt API token (or use TIDBYT_TOKEN env)')
  .option('-d, --device-id <id>', 'Tidbyt device ID (or use TIDBYT_DEVICE_ID env)')
  .option('-i, --installation-id <id>', 'Tidbyt installation ID')
  .option('-p, --preview <path>', 'Save preview GIF to file instead of pushing')
  .action(async (emotionName: string, options) => {
    try {
      const styleName = resolve(options.style, 'style', undefined, 'ai-v1')!;
      const style = getStyle(styleName);
      console.log(`Style: ${style.name} | Emotion: ${emotionName}`);

      let imageBase64: string;

      if (style.type === 'svg') {
        const pngBuffers = await loadEmotionImage(style.name, emotionName);
        const { fps } = getAnimationParams(style.name);
        imageBase64 = await pngToGifBase64(pngBuffers, undefined, fps);
      } else {
        const emotion = getEmotion(emotionName);
        const canvas = drawEmotion(emotion);
        imageBase64 = bufferToGifBase64(canvas.toBuffer());
      }
      
      if (options.preview) {
        const gifBuffer = Buffer.from(imageBase64, 'base64');
        writeFileSync(options.preview, gifBuffer);
        console.log(`✨ Preview saved to ${options.preview}`);
        return;
      }

      const token = resolve(options.token, 'token', 'TIDBYT_TOKEN');
      const deviceId = resolve(options.deviceId, 'deviceId', 'TIDBYT_DEVICE_ID');
      const installationId = resolve(options.installationId, 'installationId', undefined, 'glint')!;

      if (!token || !deviceId) {
        console.error('Error: Tidbyt token and device ID are required.');
        console.error('Provide via CLI flags, ~/.config/glint/config.json, or environment variables.');
        process.exit(1);
      }

      console.log('Pushing to Tidbyt...');
      await pushToTidbyt(imageBase64, {
        token,
        deviceId,
        installationId,
      });

      console.log(`✨ Emotion "${emotionName}" displayed successfully`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('Unknown error:', error);
      }
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available emotions and styles')
  .option('-s, --style <style>', 'show emotions for a specific style')
  .action((options) => {
    if (options.style) {
      const style = getStyle(options.style);
      console.log(`Emotions for style "${style.name}":`);
      
      if (style.type === 'svg') {
        listStyleEmotions(style.name).forEach((name) => {
          console.log(`  - ${name}`);
        });
      } else {
        listEmotions().forEach((name) => {
          console.log(`  - ${name}`);
        });
      }
    } else {
      console.log('Available styles:');
      listStyles().forEach((style) => {
        const emotions = style.type === 'image' 
          ? listStyleEmotions(style.name) 
          : listEmotions();
        const tag = style.userStyle ? ' (user)' : '';
        console.log(`  ${style.name}${tag} (${style.type}) - ${emotions.length} emotions`);
        console.log(`    ${style.description}`);
      });
      
      console.log('\nDefault emotions (programmatic):');
      listEmotions().forEach((name) => {
        console.log(`  - ${name}`);
      });
    }
  });

program
  .command('styles')
  .description('List available visual styles')
  .action(() => {
    console.log('Available styles:');
    listStyles().forEach((style) => {
      const emotions = style.type === 'svg' 
        ? listStyleEmotions(style.name) 
        : listEmotions();
      const tag = style.userStyle ? ' (user)' : '';
      const typeLabel = style.type === 'svg' ? 'SVG (scalable)' : 'Programmatic';
      console.log(`\n  ${style.name}${tag}`);
      console.log(`    Type: ${typeLabel}`);
      console.log(`    Description: ${style.description}`);
      console.log(`    Emotions: ${emotions.join(', ')}`);
    });
  });

program
  .command('validate')
  .description('Validate a style directory for correctness')
  .argument('<style>', 'style name to validate')
  .action(async (styleName: string) => {
    try {
      const style = getStyle(styleName);
      const styleDir = getStyleDir(style);

      console.log(`Validating style "${styleName}" at ${styleDir}...\n`);

      const result = await validateStyleDirectory(styleDir);

      if (result.errors.length === 0) {
        console.log(`✓ Found ${REQUIRED_EMOTIONS.length}/${REQUIRED_EMOTIONS.length} required emotions`);
        console.log('✓ All SVGs are valid (viewBox present, reasonable size)');
        console.log(`✓ Style "${styleName}" is valid!`);
      } else {
        for (const err of result.errors) {
          console.log(`✗ ${err}`);
        }
      }

      for (const warn of result.warnings) {
        console.log(`⚠ ${warn}`);
      }

      if (!result.valid) {
        process.exit(1);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate SVG emotion style using AI (LLM)')
  .argument('<style-name>', 'name for the new style (or a preset: cyberpunk, retro, spooky, nature, robot)')
  .option('--description <desc>', 'style description')
  .option('--aesthetic <aesthetic>', 'aesthetic direction for the AI')
  .option('--provider <provider>', 'LLM provider: claude, codex, opencode, api (auto-detected if omitted)')
  .option('--overwrite', 'overwrite existing style directory')
  .action(async (styleName: string, options) => {
    try {
      const { generateSvgStyle, STYLE_PRESETS } = await import('./generate-svg');
      
      const outputDir = join(USER_STYLES_DIR, styleName);
      
      // Check for existing style
      if (existsSync(outputDir) && !options.overwrite) {
        const manifest = join(outputDir, 'glint-style.json');
        if (existsSync(manifest)) {
          console.error(`Error: Style "${styleName}" already exists at ${outputDir}`);
          console.error('Use --overwrite to replace it, or choose a different name.');
          process.exit(1);
        }
      }
      
      mkdirSync(outputDir, { recursive: true });

      // Resolve options from CLI → config → defaults
      const provider = resolveGenerate(options.provider, 'provider');
      const description = resolveGenerate(options.description, 'description', undefined, `${styleName} style for glint`);
      const aesthetic = resolveGenerate(options.aesthetic, 'aesthetic', undefined, `${styleName} themed, creative and expressive`);

      // Use preset if available, otherwise build from resolved options
      const preset = STYLE_PRESETS[styleName];
      const prompt = preset || {
        name: styleName,
        description: description!,
        aesthetic: aesthetic!,
      };

      console.log(`Generating SVG style "${styleName}"...`);
      console.log(`Aesthetic: ${prompt.aesthetic}\n`);

      const svgs = await generateSvgStyle(prompt, provider);

      // Write SVGs and manifest
      const files: Record<string, string> = {};
      for (const [emotion, svg] of Object.entries(svgs)) {
        const filePath = join(outputDir, `${emotion}.svg`);
        const { writeFileSync: wf } = await import('fs');
        wf(filePath, svg);
        const { createHash } = await import('crypto');
        files[`${emotion}.svg`] = createHash('sha256').update(svg).digest('hex');
        console.log(`  ✓ ${emotion} (${Buffer.byteLength(svg)} bytes)`);
      }

      // Write manifest
      const manifest = {
        specVersion: '2.0',
        name: styleName,
        version: '1.0.0',
        description: prompt.description,
        format: 'svg',
        emotions: Object.keys(svgs),
        files,
        tags: [],
        license: 'MIT',
      };
      const { writeFileSync: wf2 } = await import('fs');
      wf2(join(outputDir, 'glint-style.json'), JSON.stringify(manifest, null, 2));

      console.log(`\n✨ Style "${styleName}" generated at ${outputDir}`);
      console.log(`Validate: glint validate ${styleName}`);
      console.log(`Publish:  glint style publish ${styleName}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

// --- Auth commands ---

const auth = program.command('auth').description('Manage registry authentication');

auth
  .command('login')
  .description('Authenticate with the Glint Community registry via GitHub')
  .action(async () => {
    try {
      const { username } = await registry.login();
      console.log(`\n✨ Authenticated as ${username}`);
      console.log(`Token saved to ~/.config/glint/auth.json`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

auth
  .command('whoami')
  .description('Show current authenticated user')
  .action(async () => {
    try {
      const user = await registry.whoami();
      console.log(`Logged in as: ${user.username}`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

auth
  .command('token')
  .description('Create a new API token for CI/automation')
  .requiredOption('--name <name>', 'Token name')
  .action(async (options) => {
    try {
      const result = await registry.createToken(options.name);
      console.log(`\nToken created: ${result.token}`);
      console.log(`\n⚠️  Save this token — it won't be shown again.`);
      console.log(`Use with: GLINT_TOKEN=${result.token} glint style publish <name>`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

auth
  .command('logout')
  .description('Remove stored authentication')
  .action(() => {
    const { existsSync: ex, unlinkSync } = require('fs');
    const { join: j } = require('path');
    const { homedir: hd } = require('os');
    const authFile = j(hd(), '.config', 'glint', 'auth.json');
    if (ex(authFile)) {
      unlinkSync(authFile);
      console.log('Logged out. Token removed.');
    } else {
      console.log('Not logged in.');
    }
  });

// --- Style registry commands ---

const style = program.command('style').description('Manage community styles');

style
  .command('search')
  .description('Search the community registry')
  .argument('[query]', 'search query')
  .option('-a, --author <author>', 'filter by author')
  .action(async (query, options) => {
    try {
      const result = await registry.search(query, options.author);
      if (result.styles.length === 0) {
        console.log('No styles found.');
        return;
      }
      console.log(`${result.total} style(s) found:\n`);
      for (const s of result.styles) {
        console.log(`  @${s.author}/${s.slug}  v${s.version}  ⬇ ${s.download_count}`);
        console.log(`    ${s.description}`);
      }
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

style
  .command('info')
  .description('Show details about a community style')
  .argument('<ref>', 'style reference (@author/name)')
  .action(async (ref) => {
    try {
      const match = ref.match(/^@?([^/]+)\/(.+)$/);
      if (!match) throw new Error('Use format: @author/name');
      const [, author, slug] = match;
      const info = await registry.getStyleInfo(author, slug);
      console.log(`\n  @${info.author}/${info.slug}  v${info.version}`);
      console.log(`  ${info.description}`);
      console.log(`  ⬇ ${info.download_count} downloads`);
      console.log(`  Published: ${info.published_at}`);
      console.log(`\n  Emotions: ${info.emotions.map((e: any) => e.emotion).join(', ')}`);
      console.log(`\n  Install: glint style install @${info.author}/${info.slug}`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

style
  .command('install')
  .description('Install a style from the community registry')
  .argument('<ref>', 'style reference (@author/name)')
  .action(async (ref) => {
    try {
      console.log(`Installing ${ref}...`);
      const installDir = await registry.install(ref);
      console.log(`\n✨ Installed to ${installDir}`);
      console.log(`Use with: glint show happy --style ${ref.replace(/^@?[^/]+\//, '')}`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

style
  .command('publish')
  .description('Publish a user style to the community registry')
  .argument('<name>', 'style name (from ~/.config/glint/styles/)')
  .action(async (name) => {
    try {
      console.log(`Publishing "${name}"...`);
      const result = await registry.publish(name);
      console.log(`\n✨ Published! ${result.url}`);
      console.log(`Install: ${result.install}`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

style
  .command('init')
  .description('Scaffold a new style package')
  .argument('<name>', 'style name')
  .action(async (name) => {
    const { USER_STYLES_DIR } = await import('./styles');
    const styleDir = join(USER_STYLES_DIR, name);
    mkdirSync(styleDir, { recursive: true });

    // Write manifest
    const manifest = {
      specVersion: '1.0',
      name,
      version: '1.0.0',
      description: `${name} style for glint`,
      emotions: [...REQUIRED_EMOTIONS],
      files: {},
      tags: [],
      license: 'MIT',
    };
    writeFileSync(join(styleDir, 'glint-style.json'), JSON.stringify(manifest, null, 2));

    // Create placeholder SVGs (dark rectangle with simple eyes)
    for (const emotion of REQUIRED_EMOTIONS) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32" width="64" height="32">
  <rect width="64" height="32" fill="#111"/>
  <circle cx="22" cy="14" r="5" fill="#333"/>
  <circle cx="42" cy="14" r="5" fill="#333"/>
  <!-- TODO: design ${emotion} eyes -->
</svg>`;
      writeFileSync(join(styleDir, `${emotion}.svg`), svg);
    }

    console.log(`\n✨ Style scaffolded at ${styleDir}`);
    console.log(`\nFiles created:`);
    console.log(`  glint-style.json  (manifest)`);
    for (const emotion of REQUIRED_EMOTIONS) {
      console.log(`  ${emotion}.svg     (placeholder)`);
    }
    console.log(`\nNext steps:`);
    console.log(`  1. Replace the placeholder SVGs with your designs`);
    console.log(`  2. Edit glint-style.json (description, tags, etc.)`);
    console.log(`  3. Validate: glint validate ${name}`);
    console.log(`  4. Publish:  glint style publish ${name}`);
    console.log(`\nOr generate with AI: glint generate ${name} --aesthetic "your style"`);
  });

program.parse();
