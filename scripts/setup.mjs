import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { root } = require('../shared/settings.cjs');
const destination = path.join(root, '.env');
if (!fs.existsSync(destination)) {
  fs.copyFileSync(path.join(root, '.env.example'), destination);
  console.log('.env dibuat dalam mode demo.');
} else console.log('.env sudah ada dan dipertahankan.');
console.log('Langkah berikutnya: npx playwright install chromium, lalu npm run test:demo.');
