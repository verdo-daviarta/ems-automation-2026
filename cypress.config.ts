import { defineConfig } from 'cypress';
import { loadEnvironment, readSettings, publicSettings } from './shared/settings.cjs';
import { testId, writeSummary } from './shared/reporting.cjs';
import type { Settings } from './shared/types';

loadEnvironment();
const settings: Settings = readSettings();

export default defineConfig({
  expose: { qa: publicSettings(settings) },
  env: { credentials: settings.credentials },
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
  reporterOptions: { mochaFile: `reports/runs/${settings.runId}/cypress-[hash].xml`, toConsole: false },
  e2e: {
    baseUrl: settings.baseURL,
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    testIsolation: true,
    setupNodeEvents(on) {
      on('after:run', results => {
        if (!('runs' in results)) return;
        const tests = results.runs.flatMap(run => run.tests.map(test => ({
          testId: testId(test.title.join(' ')), title: test.title.join(' > '),
          status: test.state === 'passed' ? 'Pass' : test.state === 'failed' ? 'Fail' : 'Not Run',
          sourceState: test.state, spec: run.spec.relative, attempts: test.attempts.length,
          durationMs: test.duration
        })));
        writeSummary('cypress', settings, tests, { scope: 'UI smoke starter; lihat catalog/automation-map.json untuk subcakupan.' });
      });
    }
  }
});
