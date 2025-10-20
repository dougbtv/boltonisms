#!/usr/bin/env node
import { spawn } from 'child_process';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { glob } from 'glob';

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on('error', reject);
  });
}

async function build() {
  console.log('🏗️  Starting build...\n');

  console.log('Step 1: Pull sheet data');
  await runCommand('node', ['tools/pull-sheet.mjs']);

  console.log('\nStep 2: Validate data');
  await runCommand('node', ['tools/validate.mjs']);

  console.log('\nStep 3: Copy static assets');
  if (!existsSync('./dist')) {
    mkdirSync('./dist', { recursive: true });
  }

  if (existsSync('./public')) {
    const publicFiles = await glob('public/**/*', { nodir: true });
    publicFiles.forEach(file => {
      const destPath = file.replace('public/', 'dist/');
      const destDir = destPath.substring(0, destPath.lastIndexOf('/'));

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }

      copyFileSync(file, destPath);
      console.log(`  ✓ Copied ${file} → ${destPath}`);
    });
  }

  if (existsSync('./src')) {
    const srcFiles = await glob('src/**/*', { nodir: true });
    srcFiles.forEach(file => {
      const destPath = file.replace('src/', 'dist/');
      const destDir = destPath.substring(0, destPath.lastIndexOf('/'));

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }

      copyFileSync(file, destPath);
      console.log(`  ✓ Copied ${file} → ${destPath}`);
    });
  }

  console.log('\n✅ Build complete!');
}

async function main() {
  try {
    await build();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Build failed:', error.message);
    process.exit(1);
  }
}

main();
