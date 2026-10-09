const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readSettings, publicSettings } = require('../shared/settings.cjs');
const { testId, playwrightStatus } = require('../shared/reporting.cjs');

test('staging tanpa URL gagal, tidak fallback ke demo', () => {
  assert.throws(() => readSettings({ QA_TARGET: 'staging' }), /QA_BASE_URL/);
});
test('staging tidak menerima kontrak selector yang belum direview', () => {
  assert.throws(() => readSettings({ QA_TARGET: 'staging', QA_BASE_URL: 'https://staging.example.test',
    QA_ADMIN_EMAIL: 'admin@example.test', QA_ADMIN_PASSWORD: 'test-only' }), /belum direview/);
});
test('target salah tidak diam-diam menjadi demo', () => {
  assert.throws(() => readSettings({ QA_TARGET: 'production' }), /QA_TARGET/);
});
test('konfigurasi publik dan laporan metadata tidak membawa credential', () => {
  const publicConfig = publicSettings(readSettings({ QA_TARGET: 'demo' }));
  const encoded = JSON.stringify(publicConfig);
  assert.equal(encoded.includes('DemoOnly!12345'), false);
  assert.equal('credentials' in publicConfig, false);
});
test('pemetaan reporter mempertahankan Test ID, tidak menghasilkan ID palsu', () => {
  assert.equal(testId('EMS [TS-001] Login valid — admin'), 'TS-001');
  assert.equal(testId('Framework internal setup'), null);
});
test('browser tidak tersedia dilaporkan Blocked, assertion produk tetap Fail', () => {
  assert.equal(playwrightStatus('failed', "Error: browserType.launch: Executable doesn't exist at /tmp/browser"), 'Blocked');
  assert.equal(playwrightStatus('failed', 'expect(locator).toBeVisible: Timeout'), 'Fail');
  assert.equal(playwrightStatus('skipped'), 'Not Run');
});
