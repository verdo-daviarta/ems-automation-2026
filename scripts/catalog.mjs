import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { root } = require('../shared/settings.cjs');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog', 'test-scenarios.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(root, 'catalog', 'automation-map.json'), 'utf8'));
const ids = new Set(catalog.scenarios.map(s => s.testId));
const seen = new Set();
for (const entry of map.implementations) {
  if (!ids.has(entry.testId)) throw new Error(`Unknown Test ID: ${entry.testId}`);
  if (seen.has(entry.testId)) throw new Error(`Duplicate implementation: ${entry.testId}`);
  seen.add(entry.testId);
  if (!fs.existsSync(path.join(root, entry.file))) throw new Error(`Missing file: ${entry.file}`);
  if (!fs.readFileSync(path.join(root, entry.file), 'utf8').includes(entry.testId)) throw new Error(`File does not reference ${entry.testId}`);
}
const pending = catalog.scenarios.filter(s => !seen.has(s.testId));
console.log(`Catalog snapshot: ${ids.size} skenario. Starter: ${seen.size} Test ID (subcakupan). Belum diimplementasi: ${pending.length}.`);
console.log('Jumlah implementasi bukan bukti full coverage atau Pass di staging.');
