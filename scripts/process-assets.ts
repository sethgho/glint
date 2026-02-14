#!/usr/bin/env bun
/**
 * Process AI-generated emotion images for Tidbyt (64x32)
 */

import sharp from 'sharp';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';

const SOURCE_DIR = '/tmp/emotions/best';
const TARGET_DIR = join(import.meta.dir, '../assets/ai-v1');

const TIDBYT_WIDTH = 64;
const TIDBYT_HEIGHT = 32;

async function processImage(sourcePath: string, targetPath: string) {
  await sharp(sourcePath)
    .resize(TIDBYT_WIDTH, TIDBYT_HEIGHT, {
      fit: 'cover',
      position: 'center'
    })
    .png()
    .toFile(targetPath);
  
  console.log(`✓ ${basename(sourcePath)} → ${basename(targetPath)}`);
}

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  if (!existsSync(TARGET_DIR)) {
    mkdirSync(TARGET_DIR, { recursive: true });
  }

  const files = readdirSync(SOURCE_DIR).filter(f => f.endsWith('.png'));
  
  console.log(`Processing ${files.length} images to ${TIDBYT_WIDTH}x${TIDBYT_HEIGHT}...`);
  
  for (const file of files) {
    const sourcePath = join(SOURCE_DIR, file);
    const targetPath = join(TARGET_DIR, file);
    await processImage(sourcePath, targetPath);
  }
  
  console.log(`\n✨ Done! Assets saved to ${TARGET_DIR}`);
}

main().catch(console.error);
