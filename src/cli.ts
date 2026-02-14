#!/usr/bin/env node

import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { getEmotion, listEmotions } from './emotions';
import { drawEmotion } from './draw';
import { bufferToGifBase64, pngToGifBase64, pushToTidbyt } from './push';
import { getStyle, listStyles, loadEmotionImage, listStyleEmotions } from './styles';

const program = new Command();

program
  .name('glint')
  .description('Express emotional status on a Tidbyt display via eyes & eyebrows')
  .version('0.3.0');

program
  .command('show')
  .description('Display an emotion on your Tidbyt')
  .argument('<emotion>', 'emotion to display (e.g., happy, sad, angry)')
  .option('-s, --style <style>', 'visual style (default, ai-v1)', 'ai-v1')
  .option('-t, --token <token>', 'Tidbyt API token (or use TIDBYT_TOKEN env)')
  .option('-d, --device-id <id>', 'Tidbyt device ID (or use TIDBYT_DEVICE_ID env)')
  .option('-i, --installation-id <id>', 'Tidbyt installation ID', 'glint')
  .option('-p, --preview <path>', 'Save preview GIF to file instead of pushing')
  .action(async (emotionName: string, options) => {
    try {
      const style = getStyle(options.style);
      console.log(`Style: ${style.name} | Emotion: ${emotionName}`);

      let imageBase64: string;

      if (style.type === 'image') {
        // Load pre-rendered image
        const pngBuffer = await loadEmotionImage(style.name, emotionName);
        imageBase64 = await pngToGifBase64(pngBuffer);
      } else {
        // Programmatic drawing
        const emotion = getEmotion(emotionName);
        const canvas = drawEmotion(emotion);
        imageBase64 = bufferToGifBase64(canvas.toBuffer());
      }
      
      // Preview mode
      if (options.preview) {
        const gifBuffer = Buffer.from(imageBase64, 'base64');
        writeFileSync(options.preview, gifBuffer);
        console.log(`✨ Preview saved to ${options.preview}`);
        return;
      }

      // Push mode
      const token = options.token || process.env.TIDBYT_TOKEN;
      const deviceId = options.deviceId || process.env.TIDBYT_DEVICE_ID;

      if (!token || !deviceId) {
        console.error('Error: TIDBYT_TOKEN and TIDBYT_DEVICE_ID are required');
        console.error('Provide via --token/--device-id or environment variables');
        process.exit(1);
      }

      console.log('Pushing to Tidbyt...');
      await pushToTidbyt(imageBase64, {
        token,
        deviceId,
        installationId: options.installationId,
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
        console.log(`  ${style.name} (${style.type}) - ${emotions.length} emotions`);
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
      console.log(`\n  ${style.name}`);
      console.log(`    Type: ${style.type}`);
      console.log(`    Description: ${style.description}`);
      console.log(`    Emotions: ${emotions.join(', ')}`);
    });
  });

program.parse();
