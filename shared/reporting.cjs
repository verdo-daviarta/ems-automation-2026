const fs = require('node:fs');
const path = require('node:path');
const { root } = require('./settings.cjs');

function testId(title) { return title.match(/\bTS-\d{3}\b/)?.[0] || null; }
function playwrightStatus(state, errorMessage = '') {
  if (state === 'passed') return 'Pass';
  if (state === 'skipped') return 'Not Run';
  if (/browserType\.launch: Executable doesn't exist/.test(errorMessage)) return 'Blocked';
  return 'Fail';
}
function writeSummary(engine, settings, tests, extra = {}) {
  const counts = tests.reduce((out, t) => { out[t.status] = (out[t.status] || 0) + 1; return out; }, {});
  const summary = {
    schemaVersion: 1, engine, runId: settings.runId, generatedAt: new Date().toISOString(),
    target: settings.target, frameworkVerificationOnly: settings.target === 'demo',
    baseURL: settings.baseURL, buildId: settings.buildId, roles: settings.roles,
    counts, ...extra, tests
  };
  const dir = path.join(root, 'reports', 'runs', settings.runId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${engine}.json`), JSON.stringify(summary, null, 2) + '\n');
  return summary;
}
module.exports = { testId, playwrightStatus, writeSummary };
