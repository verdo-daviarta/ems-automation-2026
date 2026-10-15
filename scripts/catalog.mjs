import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { root } = require('../shared/settings.cjs');
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, 'catalog', 'test-scenarios.json'), 'utf8')
);
const map = JSON.parse(fs.readFileSync(path.join(root, 'catalog', 'automation-map.json'), 'utf8'));
const scenarios = new Map(catalog.scenarios.map((s) => [s.testId, s]));
const ids = new Set(scenarios.keys());
const seen = new Set();
for (const entry of map.implementations) {
  if (!ids.has(entry.testId)) {
    throw new Error(`Unknown Test ID: ${entry.testId}`);
  }
  if (seen.has(entry.testId)) {
    throw new Error(`Duplicate implementation: ${entry.testId}`);
  }

  seen.add(entry.testId);
  const file = path.join(root, entry.file);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${entry.file}`);
  }

  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes(entry.testId)) {
    throw new Error(`File does not reference ${entry.testId}`);
  }

  const featureId = scenarios.get(entry.testId).featureId;
  if (entry.engine === 'cypress' && featureId.startsWith('FEAT-')) {
    if (!entry.file.startsWith(`cypress/e2e/${featureId}-`))
      throw new Error(`Cypress spec for ${entry.testId} must be under ${featureId}`);
    if (!source.includes(`[${featureId}] [${entry.testId}]`))
      throw new Error(
        `Cypress title for ${entry.testId} must start with ${featureId} then ${entry.testId}`
      );
  }
}
const pending = catalog.scenarios.filter((s) => !seen.has(s.testId));
console.log(
  `Catalog snapshot: ${ids.size} skenario. Starter: ${seen.size} Test ID (subcakupan). Belum diimplementasi: ${pending.length}.`
);
console.log('Jumlah implementasi bukan bukti full coverage atau Pass di staging.');
