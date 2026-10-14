const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { root, readSettings, publicSettings } = require('../shared/settings.cjs');
const { testId, playwrightStatus } = require('../shared/reporting.cjs');

test('staging tanpa URL gagal, tidak fallback ke demo', () => {
  assert.throws(() => readSettings({ QA_TARGET: 'staging' }), /QA_BASE_URL/);
});
function mockStagingContract(t, overrides = {}) {
  const originalRead = fs.readFileSync;
  const contract = JSON.parse(originalRead(path.join(root, 'config/demo.json'), 'utf8'));
  t.mock.method(fs, 'readFileSync', (file, ...args) => {
    if (path.resolve(file) === path.join(root, 'config/staging.json')) {
      return JSON.stringify({ ...contract, ...overrides });
    }
    return originalRead(file, ...args);
  });
}

test('staging tidak menerima kontrak selector yang belum direview', (t) => {
  mockStagingContract(t, { reviewed: false });
  assert.throws(
    () =>
      readSettings({
        QA_TARGET: 'staging',
        QA_BASE_URL: 'https://staging.example.test',
        QA_ADMIN_EMAIL: 'admin@example.test',
        QA_ADMIN_PASSWORD: 'test-only'
      }),
    /belum direview/
  );
});

test('staging mendukung ID login admin, pj, komandan tanpa membawa credential ke metadata', (t) => {
  mockStagingContract(t);
  const env = {
    QA_TARGET: 'staging',
    QA_BASE_URL: 'https://staging.example.test',
    QA_BUILD_ID: 'test-release',
    QA_ROLES: 'admin,pj,komandan'
  };
  for (const role of ['admin', 'pj', 'komandan']) {
    env[`QA_${role.toUpperCase()}_ID`] = `${role}-test-id`;
    env[`QA_${role.toUpperCase()}_PASSWORD`] = 'test-only-password';
  }
  const settings = readSettings(env);
  assert.deepEqual(settings.roles, ['admin', 'pj', 'komandan']);
  assert.equal(settings.credentials.komandan.email, 'komandan-test-id');
  assert.equal(settings.credentials.admin.email, 'admin-test-id');
  const metadata = JSON.stringify(publicSettings(settings));
  assert.equal(metadata.includes('test-only-password'), false);
  assert.equal(metadata.includes('komandan-test-id'), false);
});

test('ID login diprioritaskan dan alias username/email tetap kompatibel', (t) => {
  mockStagingContract(t);
  const env = {
    QA_TARGET: 'staging',
    QA_BASE_URL: 'https://staging.example.test',
    QA_BUILD_ID: 'test-release',
    QA_ADMIN_PASSWORD: 'test-only-password',
    QA_ADMIN_ID: 'preferred-id',
    QA_ADMIN_USERNAME: 'username-alias',
    QA_ADMIN_EMAIL: 'email-alias'
  };
  assert.equal(readSettings(env).credentials.admin.email, 'preferred-id');
  delete env.QA_ADMIN_ID;
  assert.equal(readSettings(env).credentials.admin.email, 'username-alias');
  delete env.QA_ADMIN_USERNAME;
  assert.equal(readSettings(env).credentials.admin.email, 'email-alias');
});

test('role tak dikenal dan ID login kosong ditolak sebelum runner berjalan', (t) => {
  mockStagingContract(t);
  const env = {
    QA_TARGET: 'staging',
    QA_BASE_URL: 'https://staging.example.test',
    QA_BUILD_ID: 'test-release',
    QA_ADMIN_PASSWORD: 'test-only-password'
  };
  assert.throws(() => readSettings({ ...env, QA_ROLES: 'unknown' }), /QA_ROLES/);
  assert.throws(() => readSettings(env), /QA_ADMIN_ID/);
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
  assert.equal(
    playwrightStatus(
      'failed',
      "Error: browserType.launch: Executable doesn't exist at /tmp/browser"
    ),
    'Blocked'
  );
  assert.equal(playwrightStatus('failed', 'expect(locator).toBeVisible: Timeout'), 'Fail');
  assert.equal(playwrightStatus('skipped'), 'Not Run');
});
