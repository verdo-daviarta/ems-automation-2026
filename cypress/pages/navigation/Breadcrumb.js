export class Breadcrumb {
  assertInformational(label) {
    return cy
      .get('header')
      .contains(label)
      .should('be.visible')
      .should(($label) => {
        expect($label, `breadcrumb ${label}`).not.to.have.attr('href');
        expect(
          $label.closest('a, button, [role="link"], [role="button"]'),
          `breadcrumb ${label} bukan kontrol navigasi`
        ).to.have.length(0);
      });
  }
}
