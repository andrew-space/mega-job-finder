#!/usr/bin/env node
// install-deps.mjs
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = __dirname;

console.log('Installing dependencies...');
console.log(`Working directory: ${projectDir}`);

try {
  execSync('npm install', {
    cwd: projectDir,
    stdio: 'inherit',
    shell: true,
  });
  console.log('✅ Dependencies installed successfully!');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}
