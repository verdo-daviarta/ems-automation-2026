import { qa } from '../../support/settings.js';

export class DevicesPage {
  trackConnection() {
    this.socketConnected = false;
    const recordConnection = (message) => {
      // Paket CONNECT Socket.IO (40) diterima setelah socket aplikasi terhubung.
      if (typeof message === 'string' && /(?:^|\x1e)40\{/.test(message)) {
        this.socketConnected = true;
      }
    };
    cy.intercept({ method: 'GET', pathname: '/socket.io/' }, (request) => {
      request.on('response', (response) => recordConnection(response.body));
    });
    cy.on('window:before:load', (window) => {
      this.socketConnected = false;
      window.WebSocket = new Proxy(window.WebSocket, {
        construct(WebSocket, args) {
          const socket = new WebSocket(...args);
          socket.addEventListener('message', (event) => recordConnection(event.data));
          return socket;
        }
      });
    });
  }

  waitForConnection() {
    return cy.wrap(this, { log: false }).its('socketConnected').should('eq', true);
  }

  openFromMenu() {
    cy.get(`a[href="${qa().contract.routes.device}"]`).click();
    cy.contains('h1', /^Devices$/).should('be.visible');
    return this.waitForConnection();
  }

  visit() {
    cy.visit(qa().contract.routes.device);
    cy.contains('h1', /^Devices$/).should('be.visible');
    return this.waitForConnection();
  }

  reload() {
    cy.reload();
    return this.waitForConnection();
  }

  openUnassignedDevice() {
    return cy
      .contains('table th', /^Room$/)
      .invoke('index')
      .then((roomColumn) => {
        // Pilih hasil pertama yang memenuhi prasyarat pengguna: belum memiliki Room.
        const deviceRow = cy
          .get('table tbody tr')
          .filter((_, row) => row.cells[roomColumn].innerText.trim() === '-')
          .should('have.length.greaterThan', 0)
          .first();
        return this.openEdit(deviceRow);
      });
  }

  deviceRow(eui) {
    return cy.contains('table tbody td', eui).closest('tr');
  }

  openDevice(eui) {
    return this.openEdit(this.deviceRow(eui).should('have.length', 1));
  }

  openEdit(deviceRow) {
    deviceRow
      .find('button[aria-label^="Edit "]')
      .should('be.visible')
      .and('be.enabled')
      .should(($button) => {
        // HTML awal dapat terlihat sebelum React memasang handler klik.
        expect($button[0].onclick, 'handler klik Edit siap').to.be.a('function');
      })
      .click();
    return this.dialog.should('be.visible').and('contain.text', 'Edit device');
  }

  selectCreatedRoom(prefix) {
    return this.roomDropdown
      .find('option')
      .filter((_, option) => option.value && option.text.startsWith(prefix))
      .should('have.length.greaterThan', 0)
      .first()
      .then(($option) => {
        const room = { id: $option.val(), name: $option.text() };
        return this.roomDropdown
          .select(room.id)
          .should('have.value', room.id)
          .then(() => room);
      });
  }

  update() {
    cy.intercept({ method: 'PUT', pathname: '/api/devices/*' }).as('updateDevice');
    this.dialog.contains('button', /^Update device$/).click();
    return cy.wait('@updateDevice');
  }

  restoreUnassignedDevice({ eui, assignedRoomId, assignedGatewayId, originalGatewayId }) {
    this.visit();
    this.openDevice(eui);
    this.euiInput.should('be.disabled').and('have.value', eui);
    this.form.then(($form) => {
      const roomId = $form.find('[name="roomId"]').val();
      const gatewayId = $form.find('[name="gatewayId"]').val();
      expect(roomId, 'Room awal atau Room yang dipilih test').to.be.oneOf(['', assignedRoomId]);
      expect(gatewayId, 'gateway awal atau gateway yang dipilih test').to.be.oneOf([
        originalGatewayId,
        assignedGatewayId
      ]);
      if (roomId === '' && gatewayId === originalGatewayId) {
        this.dialog.contains('button', /^Cancel$/).click();
      } else {
        this.roomDropdown.select('').should('have.value', '');
        this.gatewayDropdown.select(originalGatewayId).should('have.value', originalGatewayId);
        this.update().its('response.statusCode').should('eq', 200);
        this.dialog.should('not.exist');
      }
    });
    this.visit();
    this.openDevice(eui);
    this.roomDropdown.should('have.value', '');
    this.gatewayDropdown.should('have.value', originalGatewayId);
    this.euiInput.should('be.disabled').and('have.value', eui);
    return this.dialog.contains('button', /^Cancel$/).click();
  }

  get dialog() {
    return cy.get('[role="dialog"]');
  }

  get form() {
    return this.dialog.find('form');
  }

  get euiInput() {
    return this.form.find('input[name="eui"]');
  }

  get roomDropdown() {
    return this.form.find('select[name="roomId"]');
  }

  get gatewayDropdown() {
    return this.form.find('select[name="gatewayId"]');
  }
}
