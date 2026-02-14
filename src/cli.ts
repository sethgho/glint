#!/usr/bin/env node

import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { getEmotion, listEmotions } from './emotions';
import { drawEmotion } from './draw';
import { bufferToGifBase64, pushToTidbyt } from './push';

const program = new Command();

program
  .name('glint')
  .description('Express emotional status on a Tidbyt display via eyes & eyebrows')
  .version('0.2.0');

program
  .command('show')
  .description('Display an emotion on your Tidbyt')
  .argument('<emotion>', 'emotion to display (e.g., happy, sad, angry)')
  .option('-t, --token <token>', 'Tidbyt API token (or use TIDBYT_TOKEN env)')
  .option('-d, --device-id <id>', 'Tidbyt device ID (or use TIDBYT_DEVICE_ID env)')
  .option('-i, --installation-id <id>', 'Tidbyt installation ID', 'glint')
  .option('-p, --preview <path>', 'Save preview GIF to file instead of pushing')
  .action(async (emotionName: string, options) => {
    try {
      const emotion = getEmotion(emotionName);
      console.log(`Drawing emotion: ${emotion.name}`);

      // Draw the emotion
      const canvas = drawEmotion(emotion);
      const imageBase64 = bufferToGifBase64(canvas.toBuffer());
      
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

      console.log(`✨ Emotion "${emotion.name}" displayed successfully`);
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
  .description('List available emotions')
  .action(() => {
    console.log('Available emotions:');
    listEmotions().forEach((name) => {
      console.log(`  - ${name}`);
    });
  });

program.parse();
