import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import SummaryReporter from '../playwright/reporters/summary.js';
import { root, readSettings, publicSettings } from '../shared/settings.cjs';

function settingsForCheck() {
  return publicSettings(
    readSettings({ QA_TARGET: 'demo', QA_RUN_ID: `reporter-check-${randomUUID()}` })
  );
}

test('discovery tidak menulis summary eksekusi', () => {
  const settings = settingsForCheck();
  const reporter = new SummaryReporter({ settings });
  reporter.onEnd({ status: 'passed' });
  assert.equal(fs.existsSync(path.join(root, 'reports', 'runs', settings.runId)), false);
});

test('reporter JavaScript menyimpan status, TS ID, metadata, dan artifact tanpa credential', () => {
  const settings = settingsForCheck();
  const reporter = new SummaryReporter({ settings });
  const cases = [
    { id: 'pass', title: '[TS-003] API', status: 'passed', expected: 'Pass' },
    {
      id: 'fail',
      title: '[TS-046] Mobile',
      status: 'failed',
      expected: 'Fail',
      error: { message: 'Assertion timeout' }
    },
    { id: 'skip', title: '[TS-071] Responsive', status: 'skipped', expected: 'Not Run' },
    {
      id: 'blocked',
      title: '[TS-071] Responsive',
      status: 'failed',
      expected: 'Blocked',
      error: { message: "browserType.launch: Executable doesn't exist" }
    }
  ];
  for (const row of cases) {
    reporter.onTestEnd(
      {
        id: row.id,
        titlePath: () => ['EMS', 'responsive', row.title],
        annotations: [],
        location: { file: path.join(root, 'playwright/tests/responsive/login-layout.spec.js') }
      },
      {
        status: row.status,
        error: row.error,
        retry: 0,
        duration: 12,
        attachments: [
          { name: 'trace', path: 'reports/example/trace.zip' },
          { name: 'inline', body: Buffer.from('example') }
        ]
      }
    );
  }
  reporter.onEnd({ status: 'failed' });
  const summary = JSON.parse(
    fs.readFileSync(path.join(root, 'reports', 'runs', settings.runId, 'playwright.json'), 'utf8')
  );
  assert.deepEqual(summary.counts, { Pass: 1, Fail: 1, 'Not Run': 1, Blocked: 1 });
  assert.equal(summary.runnerStatus, 'failed');
  assert.equal(summary.target, 'demo');
  assert.equal(summary.buildId, 'framework-demo-v1');
  assert.equal(summary.frameworkVerificationOnly, true);
  assert.deepEqual(summary.roles, ['admin', 'pj', 'user']);
  assert.deepEqual(
    summary.tests.map((row) => row.status),
    cases.map((row) => row.expected)
  );
  assert.deepEqual(
    summary.tests.map((row) => row.testId),
    ['TS-003', 'TS-046', 'TS-071', 'TS-071']
  );
  assert.equal(summary.tests[3].sourceState, 'failed');
  assert.ok(summary.tests[3].blockerReason);
  assert.deepEqual(summary.tests[0].artifacts, [
    { name: 'trace', path: 'reports/example/trace.zip' }
  ]);
  assert.equal('credentials' in summary, false);
  assert.equal(JSON.stringify(summary).includes('DemoOnly!12345'), false);
});
