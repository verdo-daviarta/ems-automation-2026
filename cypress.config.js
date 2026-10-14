import { defineConfig } from 'cypress';
import { loadEnvironment, readSettings, publicSettings } from './shared/settings.cjs';
import { testId, writeSummary } from './shared/reporting.cjs';

loadEnvironment();
const settings = readSettings();
const rateLimitRunEnabled = process.env.QA_RUN_RATE_LIMIT === '1';
const rateLimit = settings.contract.rateLimit;

function validateRateLimitConfiguration() {
  if (!rateLimitRunEnabled) return;

  if (
    !rateLimit ||
    !rateLimit.requestPath?.startsWith('/') ||
    !Number.isInteger(rateLimit.attemptsBeforeLockCheck) ||
    rateLimit.attemptsBeforeLockCheck > 21 ||
    rateLimit.attemptsBeforeLockCheck < 1
  ) {
    throw new Error('Kontrak rateLimit belum siap atau melampaui batas aman 21 percobaan.');
  }
}

function getRateLimitAccount() {
  if (!rateLimit) return undefined;

  const account =
    settings.target === 'demo'
      ? { email: 'limit@ems-demo.test', password: 'DemoOnly!12345' }
      : settings.credentials[rateLimit.role];

  if (rateLimitRunEnabled && !account) {
    throw new Error(`Akun role ${rateLimit.role} untuk TS-004 belum dikonfigurasi.`);
  }
  return account;
}

function allowHttpStagingOrigin(browser, launchOptions) {
  if (
    settings.target !== 'staging' ||
    !settings.baseURL.startsWith('http:') ||
    browser.family !== 'chromium' ||
    browser.name === 'electron'
  ) {
    return launchOptions;
  }

  // Keep Chrome on the HTTP staging origin used by the Cypress runner.
  const host = new URL(settings.baseURL).hostname;
  const preferences = launchOptions.preferences.default;
  preferences.https_upgrades ??= {};
  preferences.https_upgrades.policy ??= {};
  const allowlist = (preferences.https_upgrades.policy.http_allowlist ??= []);
  if (!allowlist.includes(host)) allowlist.push(host);
  return launchOptions;
}

function recordRunSummary(results) {
  if (!('runs' in results)) return;

  const tests = results.runs.flatMap((run) =>
    run.tests.map((test) => ({
      testId: testId(test.title.join(' ')),
      title: test.title.join(' > '),
      status: test.state === 'passed' ? 'Pass' : test.state === 'failed' ? 'Fail' : 'Not Run',
      sourceState: test.state,
      spec: run.spec.relative,
      attempts: test.attempts.length,
      durationMs: test.duration
    }))
  );

  writeSummary('cypress', settings, tests, {
    scope: 'UI smoke starter; lihat catalog/automation-map.json untuk subcakupan.'
  });
}

validateRateLimitConfiguration();
const rateLimitAccount = getRateLimitAccount();

export default defineConfig({
  expose: { qa: { ...publicSettings(settings), rateLimitRunEnabled } },
  env: { credentials: settings.credentials, ...(rateLimitAccount ? { rateLimitAccount } : {}) },
  defaultCommandTimeout: 10000,
  requestTimeout: 15000,
  pageLoadTimeout: 60000,
  viewportWidth: 1280,
  viewportHeight: 800,
  retries: 0,
  video: false,
  screenshotOnRunFailure: true,
  screenshotsFolder: `reports/runs/${settings.runId}/cypress-screenshots`,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: `reports/runs/${settings.runId}/cypress-[hash].xml`,
    toConsole: false
  },
  e2e: {
    baseUrl: settings.baseURL,
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    testIsolation: true,
    setupNodeEvents(on) {
      on('before:browser:launch', allowHttpStagingOrigin);
      on('after:run', recordRunSummary);
    }
  }
});
