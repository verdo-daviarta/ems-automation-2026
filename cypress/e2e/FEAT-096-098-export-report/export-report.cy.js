import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { ReportPage } from '../../pages/report/ReportPage.js';
import { assertReportFile } from '../../support/reportFile.js';
import { qa } from '../../support/settings.js';

const exportFormats = [
  { label: 'PDF', extension: 'pdf', mimeType: 'application/pdf' },
  {
    label: 'Excel',
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  { label: 'CSV', extension: 'csv', mimeType: 'text/csv' }
];

describe('EMS Report exports @reports', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  scenario('[FEAT-096 - FEAT-098] [TS-067 - TS-069] Admin export Report ke PDF, Excel, dan CSV', () => {
    expect(roles).to.include('admin');
    const reportPage = new ReportPage();
    let reportPeriod;

    cy.loginAs('admin');
    new DashboardPage().assertReady();
    reportPage.openFromMenu();

    for (const format of exportFormats) {
      reportPage.exportFile(format).then(({ request, response }) => {
        expect(response.statusCode, `export ${format.label}`).to.eq(200);
        expect(response.headers['content-type']).to.include(format.mimeType);

        const params = new URL(request.url).searchParams;
        const period = { from: params.get('from'), to: params.get('to') };
        expect(period.from).to.match(/^\d{4}-\d{2}-\d{2}$/);
        expect(period.to).to.match(/^\d{4}-\d{2}-\d{2}$/);
        if (!reportPeriod) {
          reportPeriod = period;
        }
        expect(period, 'periode sama untuk semua format').to.deep.eq(reportPeriod);

        const fileName = `energy-report-${period.from}_to_${period.to}.${format.extension}`;
        expect(response.headers['content-disposition'])
          .to.include('attachment')
          .and.include(`filename="${fileName}"`);
        assertReportFile(fileName, format.extension);
      });
    }
  });
});
