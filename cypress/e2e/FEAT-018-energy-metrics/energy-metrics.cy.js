import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { qa } from '../../support/settings.js';

describe('EMS dashboard energy metrics @dashboard', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;
  const metrics = ['Current', 'Peak', 'Avg'];

  for (const role of ['admin', 'pj']) {
    scenario(`[FEAT-018] [TS-014] Informasi Current, Peak, dan Avg tersedia - ${role}`, () => {
      const dashboardPage = new DashboardPage();
      expect(roles).to.include(role);

      cy.loginAs(role);
      dashboardPage.openFromMenu();
      dashboardPage.assertReady();

      dashboardPage.energyTimelineCard.should('be.visible');
      for (const metric of metrics) {
        dashboardPage.energyTimelineMetric(metric).should('be.visible');
      }
    });
  }
});
