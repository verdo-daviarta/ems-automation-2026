import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { loadEnvironment, readSettings } = require('../shared/settings.cjs');
try {
  loadEnvironment();
  const settings = readSettings();
  const major = Number(process.versions.node.split('.')[0]);
  if (!(major === 22 || major === 24 || major >= 26)) throw new Error('Gunakan Node.js 22, 24, atau 26+. Disarankan Node 24.');
  console.log(`Node ${process.versions.node} | Target ${settings.target} | Build ${settings.buildId}`);
  console.log(`Base URL: ${settings.baseURL}`);
  console.log(`Roles: ${settings.roles.join(', ')} | API contract: ${settings.contract.api.enabled ? 'enabled' : 'disabled (API test skipped)'}`);
  console.log('Konfigurasi siap. Doctor tidak memeriksa konektivitas/login dan tidak mencetak credential.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
