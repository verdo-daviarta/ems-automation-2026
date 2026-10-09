import type { PublicSettings } from '../../shared/types';

// Hanya konfigurasi publik. Credential diambil terpisah melalui cy.env().
export function qa(): PublicSettings {
  return Cypress.expose('qa') as PublicSettings;
}
