import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { startDemo } from '../demo/server.mjs';
const require = createRequire(import.meta.url);
const { root, loadEnvironment, readSettings, publicSettings } = require('../shared/settings.cjs');
loadEnvironment();
process.chdir(root);
const [targetArg = 'configured', engine = 'all', ...extra] = process.argv.slice(2);
if (!['demo', 'staging', 'configured'].includes(targetArg) || !['all', 'cypress', 'cypress-open', 'playwright', 'playwright-ui'].includes(engine)) {
  console.error('Usage: node scripts/run.mjs demo|staging|configured all|cypress|cypress-open|playwright|playwright-ui [runner args]');
  process.exit(1);
}
if (targetArg !== 'configured') process.env.QA_TARGET = targetArg;
process.env.QA_TARGET ||= 'demo';
process.env.QA_RUN_ID = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
let demo;
let activeChild;
let recordDir;
const engineExitCodes = [];
let frameworkError;
function stopDemo() { if (demo) { demo.server.closeAllConnections(); demo.server.close(); } }
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
  activeChild?.kill(signal); stopDemo(); process.exit(signal === 'SIGINT' ? 130 : 143);
});

function runNode(cli, args, env = process.env) {
  return new Promise((resolve, reject) => {
    activeChild = spawn(process.execPath, [cli, ...args], { cwd: root, stdio: 'inherit', env });
    activeChild.once('error', reject);
    activeChild.once('exit', code => { activeChild = null; resolve(code ?? 1); });
  });
}

try {
  if (process.env.QA_TARGET === 'demo') {
    demo = await startDemo(0);
    process.env.QA_DEMO_URL = demo.url;
    process.env.QA_DEMO_MANAGED = '1';
  }
  const settings = readSettings();
  const dir = path.join(root, 'reports', 'runs', settings.runId);
  recordDir = dir;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({
    ...publicSettings(settings), frameworkVerificationOnly: settings.target === 'demo', startedAt: new Date().toISOString()
  }, null, 2) + '\n');
  console.log(`Target: ${settings.target.toUpperCase()} | Build: ${settings.buildId} | Roles: ${settings.roles.join(',')}`);
  console.log(`Run: ${settings.runId}`);
  let code = 0;
  if (engine === 'all' || engine.startsWith('cypress')) {
    const cli = path.join(root, 'node_modules', 'cypress', 'bin', 'cypress');
    const browser = settings.target === 'demo' ? 'electron' : (process.env.QA_CYPRESS_BROWSER || 'chrome');
    // Terminal berbasis Electron dapat mewariskan mode Node ke executable Cypress.
    // Lepaskan hanya dari child Cypress; environment parent/Playwright dipertahankan.
    const cypressEnv = { ...process.env };
    delete cypressEnv.ELECTRON_RUN_AS_NODE;
    const result = await runNode(cli, [engine === 'cypress-open' ? 'open' : 'run', '--e2e', '--browser', browser, ...extra], cypressEnv);
    engineExitCodes.push({ engine: 'cypress', exitCode: result });
    if (result) code = result;
  }
  if (engine === 'all' || engine.startsWith('playwright')) {
    const cli = require.resolve('@playwright/test/cli');
    const result = await runNode(cli, ['test', ...(engine === 'playwright-ui' ? ['--ui'] : []), ...extra]);
    engineExitCodes.push({ engine: 'playwright', exitCode: result });
    if (result) code = result;
  }
  console.log(`Laporan tersimpan: reports/runs/${settings.runId}`);
  process.exitCode = code;
} catch (error) { frameworkError = error.message; console.error(error.message); process.exitCode = 1; }
finally {
  if (recordDir) fs.writeFileSync(path.join(recordDir, 'execution.json'), JSON.stringify({
    finishedAt: new Date().toISOString(), target: process.env.QA_TARGET, exitCode: process.exitCode || 0,
    engineExitCodes, ...(frameworkError ? { frameworkError } : {})
  }, null, 2) + '\n');
  stopDemo();
}
