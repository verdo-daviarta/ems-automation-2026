import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const isJavaScript = file => /\.(?:js|cjs|mjs)$/.test(file);
function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : isJavaScript(file) ? [file] : [];
  });
}

const files = [
  ...fs.readdirSync(root).filter(isJavaScript).map(file => path.join(root, file)),
  ...['checks', 'cypress', 'demo', 'playwright', 'scripts', 'shared']
    .flatMap(directory => sourceFiles(path.join(root, directory)))
].sort();
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    failed++;
    console.error(`${path.relative(root, file)}: ${result.error?.message || result.stderr}`);
  }
}
console.log(`JavaScript syntax: ${files.length - failed}/${files.length} file valid.`);
process.exitCode = failed ? 1 : 0;
