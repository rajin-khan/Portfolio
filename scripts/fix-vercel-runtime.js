#!/usr/bin/env node
/**
 * Post-build script to fix Vercel runtime configuration
 * Updates generated .vc-config.json files to use nodejs20.x instead of nodejs18.x
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const outputDir = join(projectRoot, '.vercel', 'output', 'functions');

/**
 * Recursively find all .vc-config.json files
 */
function findConfigFiles(dir, fileList = []) {
  try {
    const files = readdirSync(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
        findConfigFiles(filePath, fileList);
      } else if (file === '.vc-config.json') {
        fileList.push(filePath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read, skip it
  }
  
  return fileList;
}

// Find all .vc-config.json files
const configFiles = findConfigFiles(outputDir);

let fixed = 0;

for (const configFile of configFiles) {
  try {
    const config = JSON.parse(readFileSync(configFile, 'utf-8'));
    
    if (config.runtime === 'nodejs18.x') {
      config.runtime = 'nodejs20.x';
      writeFileSync(configFile, JSON.stringify(config, null, '\t') + '\n', 'utf-8');
      const relativePath = configFile.replace(projectRoot, '.');
      console.log(`✓ Updated ${relativePath} to use nodejs20.x`);
      fixed++;
    }
  } catch (error) {
    console.error(`Error processing ${configFile}:`, error.message);
  }
}

if (fixed > 0) {
  console.log(`\n✓ Fixed ${fixed} function runtime configuration(s)`);
} else if (configFiles.length === 0) {
  console.log('⚠ No .vc-config.json files found (this is normal if functions directory doesn\'t exist yet)');
} else {
  console.log('✓ All function runtimes are already configured correctly');
}

