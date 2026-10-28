import { qa } from '../../support/settings.js';

export class DashboardPage {
  get contract() {
    return qa().contract;
  }

  get ready() {
    return cy.get(this.contract.selectors.dashboardReady);
  }

  get logoutButton() {
    return cy.get(this.contract.selectors.logout);
  }

  get energyUsageCard() {
    return cy.contains('p', /^Energy usage$/).closest('div.rounded-xl');
  }

  get energyUsageUnit() {
    return this.energyUsageCard.contains('span', /^kWh$/);
  }

  get energyUsageValue() {
    return this.energyUsageUnit.prev('span');
  }

  get energyComparison() {
    return this.energyUsageCard.contains('p', /from yesterday$/);
  }

  get energyTimelineCard() {
    return cy.contains('p', /^Energy usage timeline$/).closest('div.rounded-xl');
  }

  get energyTimelineChart() {
    return this.energyTimelineCard.find('svg.recharts-surface');
  }

  get energyTimelineCurve() {
    return this.energyTimelineChart.find('path.recharts-line-curve');
  }

  get energyTimelinePoints() {
    return this.energyTimelineChart.find('circle');
  }

  energyTimelineFilter(period) {
    return this.energyTimelineCard.contains('button', period);
  }

  energyTimelineMetric(label) {
    return this.energyTimelineCard.contains('span', label);
  }

  selectEnergyTimelinePeriod(period) {
    return this.energyTimelineFilter(period).should('be.visible').and('be.enabled').click();
  }

  openFromMenu() {
    return cy.get(`a[href="${this.contract.routes.dashboard}"]`).should('be.visible').click();
  }

  trackEnergySummary() {
    this.energySummaryReceived = false;
    const recordSummary = (message) => {
      if (
        typeof message === 'string' &&
        message.includes('"energyUsage"') &&
        message.includes('"changePercentFromYesterday"')
      ) {
        this.energySummaryReceived = true;
      }
    };

    // Socket.IO dapat menerima summary lewat polling atau WebSocket.
    cy.intercept({ method: 'GET', pathname: '/socket.io/' }, (request) => {
      request.on('response', (response) => recordSummary(response.body));
    });
    cy.on('window:before:load', (window) => {
      window.WebSocket = new Proxy(window.WebSocket, {
        construct(WebSocket, args) {
          const socket = new WebSocket(...args);
          socket.addEventListener('message', (event) => recordSummary(event.data));
          return socket;
        }
      });
    });
  }

  waitForEnergySummary() {
    return cy.wrap(this, { log: false }).its('energySummaryReceived').should('eq', true);
  }

  assertReady() {
    cy.location('pathname').should('eq', this.contract.routes.dashboard);
    return this.ready.should('be.visible');
  }

  logout() {
    return this.logoutButton.click();
  }
}
