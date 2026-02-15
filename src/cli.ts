#!/usr/bin/env node

import { Command } from 'commander';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getEmotion, listEmotions } from './emotions';
import { drawEmotion } from './draw';
import { bufferToGifBase64, pngToGifBase64, pushToTidbyt } from './push';
import { getStyle, listStyles, loadEmotionImage, listStyleEmotions, getStyleDir, USER_STYLES_DIR } from './styles';
import { resolve, loadConfig } from './config';
import { validateStyleDirectory, REQUIRED_EMOTIONS } from './validate';

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

      if (style.type === 'image') {
        const pngBuffer = await loadEmotionImage(style.name, emotionName);
        imageBase64 = await pngToGifBase64(pngBuffer, emotionName);
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
      
      if (style.type === 'image') {
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
      const emotions = style.type === 'image' 
        ? listStyleEmotions(style.name) 
        : listEmotions();
      const tag = style.userStyle ? ' (user)' : '';
      console.log(`\n  ${style.name}${tag}`);
      console.log(`    Type: ${style.type}`);
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
        console.log('✓ All images are 64x32');
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
  .description('Generate emotion images using AI')
  .argument('<style-name>', 'name for the new style')
  .option('--provider <provider>', 'AI provider (replicate)')
  .option('--model <model>', 'model to use')
  .option('--prompt <template>', 'prompt template ({emotion} placeholder)')
  .action(async (styleName: string, options) => {
    try {
      const config = loadConfig();
      const genConfig = (config as any).generate || {};

      const provider = options.provider || genConfig.provider || 'replicate';
      const model = options.model || genConfig.model || 'black-forest-labs/flux-schnell';
      const promptTemplate = options.prompt || genConfig.promptTemplate ||
        'Cartoon expressive {emotion} eyes on pure black background, 64x32 pixel art for LED display, simple and readable';

      if (provider !== 'replicate') {
        console.error(`Error: Unsupported provider "${provider}". Only "replicate" is supported.`);
        process.exit(1);
      }

      const apiToken = process.env.REPLICATE_API_TOKEN;
      if (!apiToken) {
        console.error('Error: REPLICATE_API_TOKEN environment variable is required.');
        process.exit(1);
      }

      const outputDir = join(USER_STYLES_DIR, styleName);
      mkdirSync(outputDir, { recursive: true });

      console.log(`Generating style "${styleName}" with ${model}...`);
      console.log(`Output: ${outputDir}\n`);

      const sharp = (await import('sharp')).default;

      for (const emotion of REQUIRED_EMOTIONS) {
        const prompt = promptTemplate.replace(/\{emotion\}/g, emotion);
        console.log(`  Generating ${emotion}...`);

        // Create prediction
        const createRes = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            input: { prompt, num_outputs: 1 },
          }),
        });

        if (!createRes.ok) {
          throw new Error(`Replicate API error: ${createRes.status} ${await createRes.text()}`);
        }

        let prediction = await createRes.json() as any;

        // Poll until complete
        while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
          await new Promise(r => setTimeout(r, 1000));
          const pollRes = await fetch(prediction.urls.get, {
            headers: { 'Authorization': `Bearer ${apiToken}` },
          });
          prediction = await pollRes.json();
        }

        if (prediction.status === 'failed') {
          console.error(`  ✗ Failed to generate ${emotion}: ${prediction.error}`);
          continue;
        }

        // Download and process image
        const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        const imageRes = await fetch(imageUrl);
        const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

        await sharp(imageBuffer)
          .resize(64, 32, { fit: 'cover', position: 'center' })
          .png()
          .toFile(join(outputDir, `${emotion}.png`));

        console.log(`  ✓ ${emotion}`);
      }

      console.log(`\n✨ Style "${styleName}" generated! Validate with: glint validate ${styleName}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

program.parse();
