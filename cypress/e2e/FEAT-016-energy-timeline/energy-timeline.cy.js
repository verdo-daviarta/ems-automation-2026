import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { qa } from '../../support/settings.js';

describe('EMS dashboard energy usage timeline @dashboard', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;
  const periods = ['Last week', 'Last month', 'Last year', 'Today'];

  for (const role of ['admin', 'pj', 'komandan']) {
    scenario(`[FEAT-016] [TS-013] Grafik dan filter Energy usage timeline - ${role}`, () => {
      const dashboardPage = new DashboardPage();
      expect(roles).to.include(role);

      cy.loginAs(role);
      dashboardPage.openFromMenu();
      dashboardPage.assertReady();

      dashboardPage.energyTimelineCard.should('be.visible');
      dashboardPage.energyTimelineFilter('Today').should('be.visible').and('be.disabled');
      dashboardPage.energyTimelineChart.should('be.visible');

      for (const period of periods) {
        dashboardPage.selectEnergyTimelinePeriod(period);

        dashboardPage.energyTimelineFilter(period).should('be.disabled');
        dashboardPage.energyTimelineChart.should('be.visible');
        dashboardPage.energyTimelineCurve.should('have.attr', 'd').and('not.be.empty');
        dashboardPage.energyTimelinePoints.should('have.length.greaterThan', 0);
      }
    });
  }
});
