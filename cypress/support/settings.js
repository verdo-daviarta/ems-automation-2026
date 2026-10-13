// Hanya konfigurasi publik. Credential diambil terpisah melalui cy.env().
export function qa() {
  return Cypress.expose('qa');
}
