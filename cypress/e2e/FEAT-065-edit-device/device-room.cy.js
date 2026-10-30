import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { DevicesPage } from '../../pages/devices/DevicesPage.js';
import { RoomsPage } from '../../pages/rooms/RoomsPage.js';
import { RoomDetailsPage } from '../../pages/rooms/RoomDetailsPage.js';
import { qa } from '../../support/settings.js';

describe('EMS Device assignment in Room details @devices @rooms', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;
  const devicesPage = new DevicesPage();

  afterEach(function () {
    if (this.deviceToRestore) {
      devicesPage.restoreUnassignedDevice(this.deviceToRestore);
    }
  });

  scenario('[FEAT-065] [TS-124] Admin melihat Device pada detail Room yang dipilih', () => {
    const roomsPage = new RoomsPage();
    const roomDetailsPage = new RoomDetailsPage();
    expect(roles).to.include('admin');

    devicesPage.trackConnection();
    cy.loginAs('admin');
    new DashboardPage().assertReady();
    devicesPage.openFromMenu();
    devicesPage.openUnassignedDevice();

    cy.fixture('devices/edit-device').then(({ roomNamePrefix }) => {
      expect(roomNamePrefix, 'prefix Room hasil Create Room').to.be.a('string').and.not.be.empty;
      devicesPage.form.then(($form) => {
        const original = {
          eui: $form.find('[name="eui"]').val(),
          name: $form.find('[name="name"]').val(),
          gatewayId: $form.find('[name="gatewayId"]').val()
        };
        expect($form.find('[name="roomId"]').val(), 'Device awal belum memiliki Room').to.eq('');
        expect(original.eui, 'EUI Device uji').to.be.a('string').and.not.be.empty;

        devicesPage.selectCreatedRoom(roomNamePrefix).then((room) => {
          cy.log(`Device uji: ${original.name}; Room: ${room.name}`);
          cy.wrap({
            eui: original.eui,
            assignedRoomId: room.id,
            assignedGatewayId: original.gatewayId,
            originalGatewayId: original.gatewayId
          }).as('deviceToRestore');

          devicesPage.update().then(({ request, response }) => {
            expect(response.statusCode, 'Update Device berhasil').to.eq(200);
            expect(request.body).to.deep.eq({
              name: original.name,
              gatewayId: original.gatewayId || null,
              roomId: room.id
            });
          });
          devicesPage.dialog.should('not.exist');
          devicesPage.deviceRow(original.eui).should('contain.text', room.name);

          roomsPage.openFromMenu();
          roomsPage.search(room.name);
          roomsPage.openDetails(room.name);
          roomDetailsPage.assertReady(room);
          roomDetailsPage
            .deviceRow(original.eui)
            .should('be.visible')
            .and('contain.text', original.name)
            .and('contain.text', original.eui);
        });
      });
    });
  });
});
