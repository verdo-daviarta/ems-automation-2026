import { testId, playwrightStatus, writeSummary } from '../../shared/reporting.cjs';
export default class SummaryReporter {
  rows = new Map();
  constructor(options) {
    this.options = options;
  }
  onTestEnd(test, result) {
    const title = test.titlePath().join(' > ');
    const status = playwrightStatus(result.status, result.error?.message || '');
    this.rows.set(test.id, {
      testId: testId(title),
      title,
      project: test.titlePath()[1],
      status,
      ...(status === 'Blocked'
        ? {
            blockerReason:
              'Browser executable belum terpasang; assertion aplikasi belum dijalankan.'
          }
        : {}),
      sourceState: result.status,
      retry: result.retry,
      durationMs: result.duration,
      annotations: test.annotations,
      spec: test.location.file.replace(process.cwd(), '.'),
      artifacts: result.attachments
        .filter((a) => a.path)
        .map((a) => ({ name: a.name, path: a.path }))
    });
  }
  onEnd(result) {
    if (!this.rows.size) return; // Discovery (--list) bukan eksekusi test.
    writeSummary('playwright', this.options.settings, [...this.rows.values()], {
      runnerStatus: result.status,
      scope: 'API/mobile starter; lihat catalog/automation-map.json untuk subcakupan.'
    });
  }
}
